-- LC — Learn & Create
-- Corrige divergência entre a checagem de elegibilidade e a emissão efetiva do certificado.
-- Preserva a definição anterior em schema privado antes da substituição.

create table if not exists nexora_private.function_backup_20260901_run12 (
  function_signature text primary key,
  function_definition text not null,
  backed_up_at timestamptz not null default now()
);

insert into nexora_private.function_backup_20260901_run12(function_signature,function_definition)
select 'nexora.issue_certificate_if_eligible(uuid)', pg_get_functiondef('nexora.issue_certificate_if_eligible(uuid)'::regprocedure)
on conflict (function_signature) do nothing;

create or replace function nexora.issue_certificate_if_eligible(p_course_id uuid)
returns nexora.certificates
language plpgsql
security definer
set search_path to 'nexora', 'public'
as $function$
declare
  v_user uuid := auth.uid();
  v_eligible boolean := false;
  v_reason text;
  v_existing nexora.certificates%rowtype;
  v_cert nexora.certificates%rowtype;
begin
  if v_user is null then
    raise exception 'authentication required';
  end if;

  select ce.eligible, ce.reason
    into v_eligible, v_reason
  from nexora.certificate_eligibility(p_course_id) ce
  limit 1;

  if not coalesce(v_eligible, false) then
    raise exception '%', coalesce(v_reason, 'certificate requirements not met');
  end if;

  select * into v_existing
  from nexora.certificates
  where user_id = v_user
    and course_id = p_course_id
  limit 1;

  if found then
    return v_existing;
  end if;

  begin
    insert into nexora.certificates(user_id, course_id, verification_code, metadata)
    values (
      v_user,
      p_course_id,
      upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 16)),
      jsonb_build_object('issued_by', 'LC — Learn & Create', 'automatic', true)
    )
    returning * into v_cert;
  exception
    when unique_violation then
      select * into v_existing
      from nexora.certificates
      where user_id = v_user
        and course_id = p_course_id
      limit 1;

      if found then
        return v_existing;
      end if;
      raise;
  end;

  return v_cert;
end;
$function$;

comment on function nexora.issue_certificate_if_eligible(uuid) is
'Emite certificado somente após reutilizar a mesma validação acadêmica de certificate_eligibility, evitando divergência entre elegibilidade e emissão.';
