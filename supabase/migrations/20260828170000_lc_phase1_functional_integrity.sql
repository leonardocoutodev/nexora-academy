-- LC Phase 1 — functional integrity for certificates and Boss Fight review.
begin;

-- Every published course gets an explicit completion contract.
insert into nexora.course_completion_rules(course_id)
select c.id
from nexora.courses c
where c.status='published'
on conflict (course_id) do nothing;

-- Normalize the two rubric shapes that accumulated during content migrations.
update nexora.projects p
set rubric=jsonb_set(
  p.rubric,
  '{criteria}',
  (
    select coalesce(
      jsonb_agg(
        case
          when elem ? 'label' and not elem ? 'name'
            then (elem - 'label') || jsonb_build_object('name',elem->>'label')
          else elem
        end
        order by ord
      ),
      '[]'::jsonb
    )
    from jsonb_array_elements(coalesce(p.rubric->'criteria','[]'::jsonb)) with ordinality as x(elem,ord)
  ),
  true
)
where jsonb_typeof(p.rubric->'criteria')='array'
  and exists (
    select 1
    from jsonb_array_elements(p.rubric->'criteria') e
    where e ? 'label' and not e ? 'name'
  );

-- Correct brand metadata on any certificate that may have been issued before this migration.
update nexora.certificates
set metadata=jsonb_set(
  jsonb_set(coalesce(metadata,'{}'::jsonb),'{issued_by}',to_jsonb('LC — Learn & Create'::text),true),
  '{version}',
  to_jsonb('lc-v1'::text),
  true
)
where coalesce(metadata->>'issued_by','') ilike '%nexora%'
   or coalesce(metadata->>'issued_by','')='';

create or replace function nexora.certificate_eligibility(p_course_id uuid)
returns table(eligible boolean, reason text)
language plpgsql
security definer
set search_path to 'nexora','public'
as $function$
declare
  v_user uuid:=auth.uid();
  v_rule nexora.course_completion_rules%rowtype;
  v_missing_lessons integer:=0;
  v_missing_module_assessments integer:=0;
  v_final_assessment_ok boolean:=true;
  v_final_project_ok boolean:=true;
  v_final_project_position integer;
begin
  if v_user is null then raise exception 'authentication required'; end if;

  select r.* into v_rule
  from nexora.course_completion_rules r
  where r.course_id=p_course_id;

  if not found then
    return query select false,'Regras de conclusão ainda não configuradas para este curso.'::text;
    return;
  end if;

  if not v_rule.certificate_enabled then
    return query select false,'Certificado não habilitado para este curso.'::text;
    return;
  end if;

  if not exists(
    select 1
    from nexora.enrollments e
    where e.user_id=v_user
      and e.course_id=p_course_id
      and e.status in ('active','completed')
  ) then
    return query select false,'Matrícula ativa não encontrada.'::text;
    return;
  end if;

  select count(*) into v_missing_lessons
  from nexora.lessons l
  join nexora.modules m on m.id=l.module_id
  where m.course_id=p_course_id
    and l.status='published'
    and not exists(
      select 1
      from nexora.lesson_progress lp
      where lp.user_id=v_user
        and lp.lesson_id=l.id
        and lp.progress>=v_rule.minimum_lesson_progress
    );

  if v_missing_lessons>0 then
    return query select false,(v_missing_lessons||' aula(s) ainda não concluída(s).')::text;
    return;
  end if;

  if v_rule.require_all_module_assessments then
    select count(*) into v_missing_module_assessments
    from nexora.assessments a
    where a.course_id=p_course_id
      and a.status='published'
      and a.module_id is not null
      and not exists(
        select 1
        from nexora.assessment_attempts aa
        where aa.user_id=v_user
          and aa.assessment_id=a.id
          and aa.score>=greatest(a.pass_score,v_rule.minimum_assessment_score)
      )
      and not exists(
        select 1
        from nexora.learning_credits lc
        where lc.user_id=v_user
          and lc.target_module_id=a.module_id
      );

    if v_missing_module_assessments>0 then
      return query select false,(v_missing_module_assessments||' checkpoint(s) de módulo ainda não aprovado(s).')::text;
      return;
    end if;
  end if;

  if v_rule.require_final_assessment then
    select exists(
      select 1
      from nexora.assessments a
      join nexora.assessment_attempts aa
        on aa.assessment_id=a.id
       and aa.user_id=v_user
      where a.course_id=p_course_id
        and a.status='published'
        and a.module_id is null
        and aa.score>=greatest(a.pass_score,v_rule.minimum_assessment_score)
    ) into v_final_assessment_ok;

    if not v_final_assessment_ok then
      return query select false,'Avaliação final ainda não aprovada.'::text;
      return;
    end if;
  end if;

  if v_rule.require_final_project then
    select max(m.position) into v_final_project_position
    from nexora.projects p
    join nexora.modules m on m.id=p.module_id
    where p.course_id=p_course_id
      and p.status='published'
      and p.project_kind='boss_fight';

    if v_final_project_position is null then
      return query select false,'Projeto integrador final ainda não configurado.'::text;
      return;
    end if;

    select exists(
      select 1
      from nexora.projects p
      join nexora.modules m on m.id=p.module_id
      join nexora.project_submissions ps
        on ps.project_id=p.id
       and ps.user_id=v_user
      where p.course_id=p_course_id
        and p.status='published'
        and p.project_kind='boss_fight'
        and m.position=v_final_project_position
        and ps.status in ('approved','reviewed')
        and coalesce(ps.score,0)>=v_rule.minimum_project_score
    ) into v_final_project_ok;

    if not v_final_project_ok then
      return query select false,('Projeto integrador final ainda não aprovado com nota mínima de '||trim(to_char(v_rule.minimum_project_score,'FM999990.##'))||'%.')::text;
      return;
    end if;
  end if;

  return query select true,'Todos os requisitos acadêmicos foram concluídos. Seu certificado está pronto para emissão.'::text;
end
$function$;

revoke all on function nexora.certificate_eligibility(uuid) from public,anon;
grant execute on function nexora.certificate_eligibility(uuid) to authenticated;

create or replace function nexora.try_issue_certificate(p_course_id uuid)
returns table(issued boolean, reason text, verification_code text)
language plpgsql
security definer
set search_path to 'nexora','public'
as $function$
declare
  v_user uuid:=auth.uid();
  v_eligible boolean:=false;
  v_reason text;
  v_code text;
begin
  if v_user is null then raise exception 'authentication required'; end if;

  select e.eligible,e.reason
    into v_eligible,v_reason
  from nexora.certificate_eligibility(p_course_id) e;

  if not coalesce(v_eligible,false) then
    return query select false,coalesce(v_reason,'Requisitos acadêmicos ainda não concluídos.'),null::text;
    return;
  end if;

  select c.verification_code into v_code
  from nexora.certificates c
  where c.user_id=v_user and c.course_id=p_course_id
  limit 1;

  if v_code is null then
    v_code:=upper(substr(replace(gen_random_uuid()::text,'-',''),1,12));

    insert into nexora.certificates(user_id,course_id,verification_code,metadata)
    values(
      v_user,
      p_course_id,
      v_code,
      jsonb_build_object(
        'issued_by','LC — Learn & Create',
        'version','lc-v1',
        'completion_rules','v1'
      )
    )
    on conflict (user_id,course_id) do nothing;

    select c.verification_code into v_code
    from nexora.certificates c
    where c.user_id=v_user and c.course_id=p_course_id
    limit 1;
  end if;

  return query select true,'Certificado emitido com sucesso.'::text,v_code;
end
$function$;

revoke all on function nexora.try_issue_certificate(uuid) from public,anon;
grant execute on function nexora.try_issue_certificate(uuid) to authenticated;

create or replace function nexora.verify_certificate(p_code text)
returns table(valid boolean, student_name text, course_title text, issued_at timestamp with time zone, verification_code text)
language sql
security definer
set search_path to 'nexora','public'
as $function$
  select
    true,
    coalesce(nullif(trim(p.full_name),''),'Aluno LC'),
    c.title,
    cert.issued_at,
    cert.verification_code
  from nexora.certificates cert
  join nexora.profiles p on p.id=cert.user_id
  join nexora.courses c on c.id=cert.course_id
  where length(trim(p_code)) between 6 and 64
    and upper(cert.verification_code)=upper(trim(p_code))
  limit 1
$function$;

revoke all on function nexora.verify_certificate(text) from public;
grant execute on function nexora.verify_certificate(text) to anon,authenticated;

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
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if not nexora_private.is_admin() then raise exception 'admin_required'; end if;

  if p_status not in ('approved','revision_requested') then
    raise exception 'invalid_review_status';
  end if;

  select ps.* into v_submission
  from nexora.project_submissions ps
  where ps.id=p_submission_id
  for update;

  if not found then raise exception 'submission_not_found'; end if;

  select coalesce(r.minimum_project_score,70) into v_required_score
  from nexora.projects p
  left join nexora.course_completion_rules r on r.course_id=p.course_id
  where p.id=v_submission.project_id;

  v_required_score:=coalesce(v_required_score,70);

  if p_score is not null and (p_score<0 or p_score>100) then
    raise exception 'invalid_score';
  end if;

  if p_status='approved' then
    if p_score is null then raise exception 'score_required'; end if;
    if p_score<v_required_score then
      raise exception 'approved_score_below_requirement';
    end if;
  end if;

  update nexora.project_submissions ps
  set status=p_status,
      score=case when p_status='revision_requested' then p_score else p_score end,
      feedback=nullif(trim(coalesce(p_feedback,'')),''),
      reviewed_at=now()
  where ps.id=p_submission_id
  returning ps.* into v_submission;

  return query
  select v_submission.id,v_submission.status,v_submission.score,v_submission.feedback,v_submission.reviewed_at;
end
$function$;

revoke all on function nexora.review_project_submission(uuid,text,numeric,text) from public,anon;
grant execute on function nexora.review_project_submission(uuid,text,numeric,text) to authenticated;

commit;
