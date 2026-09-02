create table if not exists nexora.manual_certificates (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references nexora.courses(id) on delete restrict,
  recipient_name text not null check (char_length(trim(recipient_name)) between 2 and 180),
  verification_code text not null unique check (verification_code ~ '^LCM-[A-F0-9]{12}$'),
  issued_at timestamptz not null default now(),
  reason text not null check (char_length(trim(reason)) >= 12),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table nexora.manual_certificates enable row level security;
revoke all on table nexora.manual_certificates from public, anon, authenticated;
grant select, insert, update, delete on table nexora.manual_certificates to service_role;

create index if not exists manual_certificates_course_id_idx
  on nexora.manual_certificates(course_id);
create index if not exists manual_certificates_issued_at_idx
  on nexora.manual_certificates(issued_at desc);

create or replace function nexora.admin_issue_external_certificate(
  p_recipient_name text,
  p_course_id uuid,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path to 'nexora','nexora_private','public','auth'
as $function$
declare
  v_actor uuid:=auth.uid();
  v_name text:=regexp_replace(trim(coalesce(p_recipient_name,'')),'\s+',' ','g');
  v_reason text:=trim(coalesce(p_reason,''));
  v_code text;
  v_id uuid;
  v_issued_at timestamptz;
  v_course_title text;
begin
  if v_actor is null or not nexora_private.is_admin() then
    raise exception 'admin_required';
  end if;
  if char_length(v_name) < 2 or char_length(v_name) > 180 then
    raise exception 'invalid_recipient_name';
  end if;
  if char_length(v_reason) < 12 then
    raise exception 'manual_issue_reason_required';
  end if;

  select c.title into v_course_title
  from nexora.courses c
  where c.id=p_course_id and c.status='published'
  limit 1;
  if v_course_title is null then raise exception 'published_course_required'; end if;

  loop
    v_code:='LCM-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12));
    exit when not exists(select 1 from nexora.certificates c where upper(c.verification_code)=upper(v_code))
      and not exists(select 1 from nexora.manual_certificates m where upper(m.verification_code)=upper(v_code));
  end loop;

  insert into nexora.manual_certificates(
    course_id,recipient_name,verification_code,reason,metadata,created_by
  ) values(
    p_course_id,v_name,v_code,v_reason,
    jsonb_build_object(
      'issued_by','LC — Learn & Create',
      'version','lc-v1',
      'issued_via','admin_external',
      'academic_record_type','external_manual'
    ),
    v_actor
  )
  returning id,issued_at into v_id,v_issued_at;

  insert into nexora.admin_audit_log(actor_id,action,target_type,target_id,details)
  values(
    v_actor,'certificate_external_issue','manual_certificate',v_id,
    jsonb_build_object(
      'recipient_name',v_name,
      'course_id',p_course_id,
      'course_title',v_course_title,
      'verification_code',v_code,
      'reason',v_reason
    )
  );

  return jsonb_build_object(
    'issued',true,
    'certificate_id',v_id,
    'recipient_name',v_name,
    'course_id',p_course_id,
    'course_title',v_course_title,
    'verification_code',v_code,
    'issued_at',v_issued_at
  );
end
$function$;

revoke all on function nexora.admin_issue_external_certificate(text,uuid,text) from public,anon;
grant execute on function nexora.admin_issue_external_certificate(text,uuid,text) to authenticated;

create or replace function nexora.verify_certificate(p_code text)
returns table(
  valid boolean,
  student_name text,
  course_title text,
  issued_at timestamptz,
  verification_code text
)
language sql
security definer
set search_path to 'nexora','public'
as $function$
  with normal as (
    select
      true as valid,
      coalesce(nullif(trim(p.full_name),''),'Aluno LC')::text as student_name,
      c.title::text as course_title,
      cert.issued_at,
      cert.verification_code::text
    from nexora.certificates cert
    join nexora.profiles p on p.id=cert.user_id
    join nexora.courses c on c.id=cert.course_id
    where length(trim(p_code)) between 6 and 64
      and upper(cert.verification_code)=upper(trim(p_code))
  ),
  external as (
    select
      true as valid,
      m.recipient_name::text as student_name,
      c.title::text as course_title,
      m.issued_at,
      m.verification_code::text
    from nexora.manual_certificates m
    join nexora.courses c on c.id=m.course_id
    where length(trim(p_code)) between 6 and 64
      and upper(m.verification_code)=upper(trim(p_code))
  )
  select * from normal
  union all
  select * from external
  limit 1
$function$;

revoke all on function nexora.verify_certificate(text) from public;
grant execute on function nexora.verify_certificate(text) to anon,authenticated;

create or replace function nexora.admin_certificate_roster(
  p_search text default null::text,
  p_course_id uuid default null::uuid
)
returns table(
  certificate_id uuid,
  user_id uuid,
  student_name text,
  email text,
  course_id uuid,
  course_title text,
  verification_code text,
  issued_at timestamptz
)
language plpgsql
security definer
set search_path to 'nexora','public','auth'
as $function$
begin
  if auth.uid() is null or not nexora_private.is_admin() then
    raise exception 'admin_required';
  end if;

  return query
  select *
  from (
    select cert.id as certificate_id,p.id as user_id,
           coalesce(nullif(trim(p.full_name),''),'Aluno LC')::text as student_name,
           u.email::text as email,c.id as course_id,c.title::text as course_title,
           cert.verification_code::text as verification_code,cert.issued_at
    from nexora.certificates cert
    join nexora.profiles p on p.id=cert.user_id
    join auth.users u on u.id=p.id
    join nexora.courses c on c.id=cert.course_id
    where (p_course_id is null or c.id=p_course_id)

    union all

    select m.id as certificate_id,null::uuid as user_id,
           m.recipient_name::text as student_name,
           null::text as email,c.id as course_id,c.title::text as course_title,
           m.verification_code::text as verification_code,m.issued_at
    from nexora.manual_certificates m
    join nexora.courses c on c.id=m.course_id
    where (p_course_id is null or c.id=p_course_id)
  ) r
  where (
    p_search is null or trim(p_search)='' or
    r.student_name ilike '%'||trim(p_search)||'%' or
    coalesce(r.email,'') ilike '%'||trim(p_search)||'%' or
    r.verification_code ilike '%'||trim(p_search)||'%'
  )
  order by r.issued_at desc;
end
$function$;

revoke all on function nexora.admin_certificate_roster(text,uuid) from public,anon;
grant execute on function nexora.admin_certificate_roster(text,uuid) to authenticated;
