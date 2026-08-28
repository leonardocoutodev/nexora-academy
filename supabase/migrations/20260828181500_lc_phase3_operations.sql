-- LC Phase 3 — Operations center, admin-safe reads and audit trail.
begin;

-- Prevent profile self-service from ever changing privilege-bearing columns.
revoke update on table nexora.profiles from authenticated;
grant update(full_name,avatar_path,updated_at) on table nexora.profiles to authenticated;

create table if not exists nexora.admin_audit_log(
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users(id) on delete restrict,
  action text not null,
  target_type text not null,
  target_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table nexora.admin_audit_log enable row level security;

drop policy if exists nexora_admin_audit_select on nexora.admin_audit_log;
create policy nexora_admin_audit_select
on nexora.admin_audit_log
for select
to authenticated
using ((select nexora_private.is_admin()));

revoke insert,update,delete on nexora.admin_audit_log from authenticated;
grant select on nexora.admin_audit_log to authenticated;

create index if not exists admin_audit_log_created_at_idx
  on nexora.admin_audit_log(created_at desc);
create index if not exists admin_audit_log_target_idx
  on nexora.admin_audit_log(target_type,target_id,created_at desc);

create or replace function nexora.admin_operational_summary()
returns jsonb
language plpgsql
security definer
set search_path to 'nexora','public','auth'
as $function$
declare
  v jsonb;
begin
  if auth.uid() is null or not nexora_private.is_admin() then
    raise exception 'admin_required';
  end if;

  select jsonb_build_object(
    'students',(select count(*) from nexora.profiles p where p.role='student'),
    'active_students',(select count(*) from nexora.profiles p where p.role='student' and p.status='active'),
    'blocked_students',(select count(*) from nexora.profiles p where p.role='student' and p.status='blocked'),
    'active_enrollments',(select count(*) from nexora.enrollments e where e.status='active'),
    'completed_enrollments',(select count(*) from nexora.enrollments e where e.status='completed'),
    'completed_lessons',(select count(*) from nexora.lesson_progress lp where lp.progress>=100),
    'assessment_attempts',(select count(*) from nexora.assessment_attempts aa where aa.submitted_at is not null),
    'pending_boss',(select count(*) from nexora.project_submissions ps where ps.status='submitted'),
    'revision_boss',(select count(*) from nexora.project_submissions ps where ps.status='revision_requested'),
    'approved_boss',(select count(*) from nexora.project_submissions ps where ps.status in ('approved','reviewed')),
    'certificates',(select count(*) from nexora.certificates),
    'published_courses',(select count(*) from nexora.courses c where c.status='published'),
    'published_lessons',(select count(*) from nexora.lessons l where l.status='published')
  ) into v;

  return v;
end
$function$;

revoke all on function nexora.admin_operational_summary() from public,anon;
grant execute on function nexora.admin_operational_summary() to authenticated;

create or replace function nexora.admin_student_roster(
  p_search text default null,
  p_status text default null,
  p_course_id uuid default null
)
returns table(
  user_id uuid,
  full_name text,
  email text,
  role text,
  status text,
  created_at timestamptz,
  enrollments_count integer,
  active_enrollments integer,
  completed_lessons integer,
  average_progress numeric,
  assessment_attempts integer,
  average_score numeric,
  boss_submissions integer,
  certificates_count integer,
  last_activity timestamptz
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
  select
    p.id,
    coalesce(nullif(trim(p.full_name),''),'Aluno LC')::text,
    u.email::text,
    p.role,
    p.status,
    p.created_at,
    (select count(*)::int from nexora.enrollments e where e.user_id=p.id),
    (select count(*)::int from nexora.enrollments e where e.user_id=p.id and e.status='active'),
    (select count(*)::int from nexora.lesson_progress lp where lp.user_id=p.id and lp.progress>=100),
    coalesce((select round(avg(lp.progress),1) from nexora.lesson_progress lp where lp.user_id=p.id),0)::numeric,
    (select count(*)::int from nexora.assessment_attempts aa where aa.user_id=p.id and aa.submitted_at is not null),
    coalesce((select round(avg(aa.score),1) from nexora.assessment_attempts aa where aa.user_id=p.id and aa.submitted_at is not null),0)::numeric,
    (select count(*)::int from nexora.project_submissions ps where ps.user_id=p.id),
    (select count(*)::int from nexora.certificates cert where cert.user_id=p.id),
    greatest(
      p.updated_at,
      (select max(lp.updated_at) from nexora.lesson_progress lp where lp.user_id=p.id),
      (select max(aa.submitted_at) from nexora.assessment_attempts aa where aa.user_id=p.id),
      (select max(ps.submitted_at) from nexora.project_submissions ps where ps.user_id=p.id)
    )
  from nexora.profiles p
  join auth.users u on u.id=p.id
  where
    (p_search is null or trim(p_search)='' or p.full_name ilike '%'||trim(p_search)||'%' or u.email ilike '%'||trim(p_search)||'%')
    and (p_status is null or trim(p_status)='' or p.status=p_status)
    and (
      p_course_id is null
      or exists(select 1 from nexora.enrollments e where e.user_id=p.id and e.course_id=p_course_id)
    )
  order by
    case when p.role='student' then 0 else 1 end,
    coalesce(nullif(trim(p.full_name),''),u.email);
end
$function$;

revoke all on function nexora.admin_student_roster(text,text,uuid) from public,anon;
grant execute on function nexora.admin_student_roster(text,text,uuid) to authenticated;

create or replace function nexora.admin_student_detail(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'nexora','public','auth'
as $function$
declare
  v jsonb;
begin
  if auth.uid() is null or not nexora_private.is_admin() then
    raise exception 'admin_required';
  end if;

  if not exists(select 1 from nexora.profiles p where p.id=p_user_id) then
    raise exception 'student_not_found';
  end if;

  select jsonb_build_object(
    'profile',(
      select jsonb_build_object(
        'id',p.id,
        'full_name',coalesce(nullif(trim(p.full_name),''),'Aluno LC'),
        'email',u.email,
        'role',p.role,
        'status',p.status,
        'created_at',p.created_at,
        'updated_at',p.updated_at
      )
      from nexora.profiles p join auth.users u on u.id=p.id
      where p.id=p_user_id
    ),
    'enrollments',coalesce((
      select jsonb_agg(x order by x->>'course_title')
      from (
        select jsonb_build_object(
          'id',e.id,
          'course_id',c.id,
          'course_title',c.title,
          'status',e.status,
          'enrolled_at',e.enrolled_at,
          'completed_at',e.completed_at,
          'completed_lessons',coalesce(done.completed,0),
          'total_lessons',coalesce(total.total,0),
          'progress_percent',case when coalesce(total.total,0)=0 then 0 else round((coalesce(done.completed,0)::numeric/total.total::numeric)*100,1) end
        ) x
        from nexora.enrollments e
        join nexora.courses c on c.id=e.course_id
        left join lateral (
          select count(*)::int total
          from nexora.lessons l
          join nexora.modules m on m.id=l.module_id
          where m.course_id=e.course_id and l.status='published'
        ) total on true
        left join lateral (
          select count(*)::int completed
          from nexora.lesson_progress lp
          join nexora.lessons l on l.id=lp.lesson_id
          join nexora.modules m on m.id=l.module_id
          where lp.user_id=p_user_id and m.course_id=e.course_id and lp.progress>=100
        ) done on true
        where e.user_id=p_user_id
      ) q
    ),'[]'::jsonb),
    'attempts',coalesce((
      select jsonb_agg(to_jsonb(q) order by q.submitted_at desc)
      from (
        select aa.id,aa.score,aa.submitted_at,a.title assessment_title,c.title course_title,m.title module_title
        from nexora.assessment_attempts aa
        join nexora.assessments a on a.id=aa.assessment_id
        join nexora.courses c on c.id=a.course_id
        left join nexora.modules m on m.id=a.module_id
        where aa.user_id=p_user_id and aa.submitted_at is not null
        order by aa.submitted_at desc
        limit 30
      ) q
    ),'[]'::jsonb),
    'submissions',coalesce((
      select jsonb_agg(to_jsonb(q) order by q.submitted_at desc)
      from (
        select ps.id,ps.status,ps.score,ps.feedback,ps.submission_url,ps.submitted_at,ps.reviewed_at,
               pr.title project_title,c.title course_title,m.title module_title
        from nexora.project_submissions ps
        join nexora.projects pr on pr.id=ps.project_id
        join nexora.courses c on c.id=pr.course_id
        left join nexora.modules m on m.id=pr.module_id
        where ps.user_id=p_user_id
        order by ps.submitted_at desc
        limit 30
      ) q
    ),'[]'::jsonb),
    'certificates',coalesce((
      select jsonb_agg(to_jsonb(q) order by q.issued_at desc)
      from (
        select cert.id,cert.verification_code,cert.issued_at,c.title course_title
        from nexora.certificates cert
        join nexora.courses c on c.id=cert.course_id
        where cert.user_id=p_user_id
        order by cert.issued_at desc
      ) q
    ),'[]'::jsonb)
  ) into v;

  return v;
end
$function$;

revoke all on function nexora.admin_student_detail(uuid) from public,anon;
grant execute on function nexora.admin_student_detail(uuid) to authenticated;

create or replace function nexora.admin_update_profile(
  p_user_id uuid,
  p_status text default null,
  p_role text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'nexora','public','auth'
as $function$
declare
  v_old nexora.profiles%rowtype;
  v_new nexora.profiles%rowtype;
begin
  if auth.uid() is null or not nexora_private.is_admin() then
    raise exception 'admin_required';
  end if;

  select * into v_old from nexora.profiles where id=p_user_id for update;
  if not found then raise exception 'profile_not_found'; end if;

  if p_status is not null and p_status not in ('active','blocked','inactive') then
    raise exception 'invalid_profile_status';
  end if;
  if p_role is not null and p_role not in ('student','instructor','admin') then
    raise exception 'invalid_profile_role';
  end if;
  if p_user_id=auth.uid() and (coalesce(p_status,v_old.status)<>'active' or coalesce(p_role,v_old.role)<>'admin') then
    raise exception 'cannot_remove_own_admin_access';
  end if;

  update nexora.profiles
  set status=coalesce(p_status,status),
      role=coalesce(p_role,role),
      updated_at=now()
  where id=p_user_id
  returning * into v_new;

  insert into nexora.admin_audit_log(actor_id,action,target_type,target_id,details)
  values(auth.uid(),'profile_update','profile',p_user_id,jsonb_build_object(
    'old_status',v_old.status,'new_status',v_new.status,
    'old_role',v_old.role,'new_role',v_new.role
  ));

  return jsonb_build_object('id',v_new.id,'status',v_new.status,'role',v_new.role,'updated_at',v_new.updated_at);
end
$function$;

revoke all on function nexora.admin_update_profile(uuid,text,text) from public,anon;
grant execute on function nexora.admin_update_profile(uuid,text,text) to authenticated;

create or replace function nexora.admin_update_enrollment(
  p_enrollment_id uuid,
  p_status text
)
returns jsonb
language plpgsql
security definer
set search_path to 'nexora','public','auth'
as $function$
declare
  v_old nexora.enrollments%rowtype;
  v_new nexora.enrollments%rowtype;
begin
  if auth.uid() is null or not nexora_private.is_admin() then
    raise exception 'admin_required';
  end if;
  if p_status not in ('active','completed','paused','cancelled') then
    raise exception 'invalid_enrollment_status';
  end if;

  select * into v_old from nexora.enrollments where id=p_enrollment_id for update;
  if not found then raise exception 'enrollment_not_found'; end if;

  update nexora.enrollments
  set status=p_status,
      completed_at=case when p_status='completed' then coalesce(completed_at,now()) else null end
  where id=p_enrollment_id
  returning * into v_new;

  insert into nexora.admin_audit_log(actor_id,action,target_type,target_id,details)
  values(auth.uid(),'enrollment_status_update','enrollment',p_enrollment_id,jsonb_build_object(
    'user_id',v_new.user_id,'course_id',v_new.course_id,
    'old_status',v_old.status,'new_status',v_new.status
  ));

  return jsonb_build_object('id',v_new.id,'status',v_new.status,'completed_at',v_new.completed_at);
end
$function$;

revoke all on function nexora.admin_update_enrollment(uuid,text) from public,anon;
grant execute on function nexora.admin_update_enrollment(uuid,text) to authenticated;

create or replace function nexora.admin_create_enrollment(
  p_user_id uuid,
  p_course_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path to 'nexora','public','auth'
as $function$
declare
  v_enrollment nexora.enrollments%rowtype;
begin
  if auth.uid() is null or not nexora_private.is_admin() then
    raise exception 'admin_required';
  end if;
  if not exists(select 1 from nexora.profiles p where p.id=p_user_id and p.status<>'blocked') then
    raise exception 'student_not_available';
  end if;
  if not exists(select 1 from nexora.courses c where c.id=p_course_id and c.status='published') then
    raise exception 'course_not_available';
  end if;

  insert into nexora.enrollments(user_id,course_id,status)
  values(p_user_id,p_course_id,'active')
  on conflict(user_id,course_id)
  do update set status='active',completed_at=null
  returning * into v_enrollment;

  insert into nexora.admin_audit_log(actor_id,action,target_type,target_id,details)
  values(auth.uid(),'enrollment_activate','enrollment',v_enrollment.id,jsonb_build_object(
    'user_id',v_enrollment.user_id,'course_id',v_enrollment.course_id
  ));

  return jsonb_build_object('id',v_enrollment.id,'status',v_enrollment.status,'course_id',v_enrollment.course_id);
end
$function$;

revoke all on function nexora.admin_create_enrollment(uuid,uuid) from public,anon;
grant execute on function nexora.admin_create_enrollment(uuid,uuid) to authenticated;

create or replace function nexora.admin_boss_roster(
  p_status text default null,
  p_course_id uuid default null
)
returns table(
  submission_id uuid,
  user_id uuid,
  student_name text,
  email text,
  project_id uuid,
  project_title text,
  course_id uuid,
  course_title text,
  module_title text,
  rubric jsonb,
  xp_reward integer,
  submission_url text,
  status text,
  score numeric,
  feedback text,
  submitted_at timestamptz,
  reviewed_at timestamptz
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
  select ps.id,p.id,coalesce(nullif(trim(p.full_name),''),'Aluno LC')::text,u.email::text,
         pr.id,pr.title,c.id,c.title,m.title,pr.rubric,pr.xp_reward,
         ps.submission_url,ps.status,ps.score,ps.feedback,ps.submitted_at,ps.reviewed_at
  from nexora.project_submissions ps
  join nexora.profiles p on p.id=ps.user_id
  join auth.users u on u.id=p.id
  join nexora.projects pr on pr.id=ps.project_id
  join nexora.courses c on c.id=pr.course_id
  left join nexora.modules m on m.id=pr.module_id
  where (p_status is null or trim(p_status)='' or ps.status=p_status)
    and (p_course_id is null or c.id=p_course_id)
  order by
    case ps.status when 'submitted' then 0 when 'revision_requested' then 1 when 'approved' then 2 else 3 end,
    ps.submitted_at desc;
end
$function$;

revoke all on function nexora.admin_boss_roster(text,uuid) from public,anon;
grant execute on function nexora.admin_boss_roster(text,uuid) to authenticated;

create or replace function nexora.admin_certificate_roster(
  p_search text default null,
  p_course_id uuid default null
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
  select cert.id,p.id,coalesce(nullif(trim(p.full_name),''),'Aluno LC')::text,u.email::text,
         c.id,c.title,cert.verification_code,cert.issued_at
  from nexora.certificates cert
  join nexora.profiles p on p.id=cert.user_id
  join auth.users u on u.id=p.id
  join nexora.courses c on c.id=cert.course_id
  where (p_search is null or trim(p_search)='' or p.full_name ilike '%'||trim(p_search)||'%' or u.email ilike '%'||trim(p_search)||'%' or cert.verification_code ilike '%'||trim(p_search)||'%')
    and (p_course_id is null or c.id=p_course_id)
  order by cert.issued_at desc;
end
$function$;

revoke all on function nexora.admin_certificate_roster(text,uuid) from public,anon;
grant execute on function nexora.admin_certificate_roster(text,uuid) to authenticated;

create or replace function nexora.admin_audit_feed(p_limit integer default 50)
returns table(
  id uuid,
  actor_id uuid,
  actor_name text,
  action text,
  target_type text,
  target_id uuid,
  details jsonb,
  created_at timestamptz
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
  select l.id,l.actor_id,coalesce(nullif(trim(p.full_name),''),u.email,'Administrador')::text,
         l.action,l.target_type,l.target_id,l.details,l.created_at
  from nexora.admin_audit_log l
  left join nexora.profiles p on p.id=l.actor_id
  left join auth.users u on u.id=l.actor_id
  order by l.created_at desc
  limit greatest(1,least(coalesce(p_limit,50),200));
end
$function$;

revoke all on function nexora.admin_audit_feed(integer) from public,anon;
grant execute on function nexora.admin_audit_feed(integer) to authenticated;

-- Add audit logging to the existing secure review flow.
create or replace function nexora.review_project_submission(
  p_submission_id uuid,
  p_status text,
  p_score numeric default null,
  p_feedback text default null
)
returns table(
  submission_id uuid,
  status text,
  score numeric,
  feedback text,
  reviewed_at timestamp with time zone
)
language plpgsql
security definer
set search_path to 'nexora','public'
as $function$
declare
  v_required_score numeric:=70;
  v_submission nexora.project_submissions%rowtype;
  v_old_status text;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if not nexora_private.is_admin() then raise exception 'admin_required'; end if;
  if p_status not in ('approved','revision_requested') then raise exception 'invalid_review_status'; end if;

  select ps.* into v_submission
  from nexora.project_submissions ps
  where ps.id=p_submission_id
  for update;
  if not found then raise exception 'submission_not_found'; end if;
  v_old_status:=v_submission.status;

  select coalesce(r.minimum_project_score,70) into v_required_score
  from nexora.projects p
  left join nexora.course_completion_rules r on r.course_id=p.course_id
  where p.id=v_submission.project_id;
  v_required_score:=coalesce(v_required_score,70);

  if p_score is not null and (p_score<0 or p_score>100) then raise exception 'invalid_score'; end if;
  if p_status='approved' then
    if p_score is null then raise exception 'score_required'; end if;
    if p_score<v_required_score then raise exception 'approved_score_below_requirement'; end if;
  end if;

  update nexora.project_submissions ps
  set status=p_status,
      score=p_score,
      feedback=nullif(trim(coalesce(p_feedback,'')),''),
      reviewed_at=now()
  where ps.id=p_submission_id
  returning ps.* into v_submission;

  insert into nexora.admin_audit_log(actor_id,action,target_type,target_id,details)
  values(auth.uid(),'boss_review','project_submission',p_submission_id,jsonb_build_object(
    'old_status',v_old_status,'new_status',v_submission.status,
    'score',v_submission.score,'project_id',v_submission.project_id,'user_id',v_submission.user_id
  ));

  return query
  select v_submission.id,v_submission.status,v_submission.score,v_submission.feedback,v_submission.reviewed_at;
end
$function$;

revoke all on function nexora.review_project_submission(uuid,text,numeric,text) from public,anon;
grant execute on function nexora.review_project_submission(uuid,text,numeric,text) to authenticated;

commit;
