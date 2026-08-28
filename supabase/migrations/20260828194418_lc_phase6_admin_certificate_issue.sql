create or replace function nexora_private.certificate_eligibility_for(
  p_user_id uuid,
  p_course_id uuid
)
returns table(eligible boolean, reason text)
language plpgsql
security definer
set search_path = nexora, public
as $$
declare
  v_rule nexora.course_completion_rules%rowtype;
  v_missing_lessons integer:=0;
  v_missing_module_assessments integer:=0;
  v_final_assessment_ok boolean:=true;
  v_final_project_ok boolean:=true;
  v_final_project_position integer;
begin
  if p_user_id is null then
    return query select false,'Aluno não informado.'::text;
    return;
  end if;

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
    select 1 from nexora.enrollments e
    where e.user_id=p_user_id and e.course_id=p_course_id
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
      select 1 from nexora.lesson_progress lp
      where lp.user_id=p_user_id
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
        select 1 from nexora.assessment_attempts aa
        where aa.user_id=p_user_id
          and aa.assessment_id=a.id
          and aa.score>=greatest(a.pass_score,v_rule.minimum_assessment_score)
      )
      and not exists(
        select 1 from nexora.learning_credits lc
        where lc.user_id=p_user_id
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
       and aa.user_id=p_user_id
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
       and ps.user_id=p_user_id
      where p.course_id=p_course_id
        and p.status='published'
        and p.project_kind='boss_fight'
        and m.position=v_final_project_position
        and ps.status in ('approved','reviewed')
        and coalesce(ps.score,0)>=v_rule.minimum_project_score
    ) into v_final_project_ok;

    if not v_final_project_ok then
      return query select false,('Projeto integrador final ainda não aprovado com nota mínima de '||
        trim(to_char(v_rule.minimum_project_score,'FM999990.##'))||'%.')::text;
      return;
    end if;
  end if;

  return query select true,'Todos os requisitos acadêmicos foram concluídos.'::text;
end
$$;

revoke all on function nexora_private.certificate_eligibility_for(uuid,uuid) from public, anon, authenticated;

create or replace function nexora.admin_certificate_status(
  p_user_id uuid,
  p_course_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = nexora, public, auth
as $$
declare
  v_eligible boolean:=false;
  v_reason text:='';
  v_code text;
  v_issued_at timestamptz;
begin
  if auth.uid() is null or not nexora_private.is_admin() then
    raise exception 'admin_required';
  end if;

  if not exists(select 1 from nexora.profiles p where p.id=p_user_id) then
    raise exception 'student_not_found';
  end if;

  if not exists(select 1 from nexora.courses c where c.id=p_course_id) then
    raise exception 'course_not_found';
  end if;

  select c.verification_code,c.issued_at
  into v_code,v_issued_at
  from nexora.certificates c
  where c.user_id=p_user_id and c.course_id=p_course_id
  limit 1;

  if v_code is not null then
    return jsonb_build_object(
      'eligible',true,
      'reason','Certificado já emitido.',
      'issued',true,
      'verification_code',v_code,
      'issued_at',v_issued_at
    );
  end if;

  select x.eligible,x.reason
  into v_eligible,v_reason
  from nexora_private.certificate_eligibility_for(p_user_id,p_course_id) x;

  return jsonb_build_object(
    'eligible',coalesce(v_eligible,false),
    'reason',coalesce(v_reason,'Requisitos acadêmicos ainda não concluídos.'),
    'issued',false
  );
end
$$;

revoke all on function nexora.admin_certificate_status(uuid,uuid) from public, anon;
grant execute on function nexora.admin_certificate_status(uuid,uuid) to authenticated;

create or replace function nexora.admin_issue_certificate(
  p_user_id uuid,
  p_course_id uuid,
  p_override boolean default false,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = nexora, public, auth
as $$
declare
  v_eligible boolean:=false;
  v_eligibility_reason text:='';
  v_reason text:=nullif(trim(coalesce(p_reason,'')),'');
  v_code text;
  v_id uuid;
  v_issued_at timestamptz;
  v_manual boolean:=coalesce(p_override,false);
begin
  if auth.uid() is null or not nexora_private.is_admin() then
    raise exception 'admin_required';
  end if;

  if not exists(select 1 from nexora.profiles p where p.id=p_user_id) then
    raise exception 'student_not_found';
  end if;

  if not exists(select 1 from nexora.courses c where c.id=p_course_id) then
    raise exception 'course_not_found';
  end if;

  if not exists(
    select 1 from nexora.enrollments e
    where e.user_id=p_user_id and e.course_id=p_course_id
  ) then
    raise exception 'enrollment_required';
  end if;

  select c.id,c.verification_code,c.issued_at
  into v_id,v_code,v_issued_at
  from nexora.certificates c
  where c.user_id=p_user_id and c.course_id=p_course_id
  limit 1;

  if v_code is not null then
    return jsonb_build_object(
      'issued',true,
      'already_existed',true,
      'manual_override',coalesce((select (metadata->>'manual_override')::boolean from nexora.certificates where id=v_id),false),
      'verification_code',v_code,
      'issued_at',v_issued_at
    );
  end if;

  select x.eligible,x.reason
  into v_eligible,v_eligibility_reason
  from nexora_private.certificate_eligibility_for(p_user_id,p_course_id) x;

  if not coalesce(v_eligible,false) and not v_manual then
    return jsonb_build_object(
      'issued',false,
      'requires_override',true,
      'reason',coalesce(v_eligibility_reason,'Requisitos acadêmicos ainda não concluídos.')
    );
  end if;

  if not coalesce(v_eligible,false) and v_manual and coalesce(length(v_reason),0)<12 then
    raise exception 'manual_issue_reason_required';
  end if;

  v_code:=upper(substr(replace(gen_random_uuid()::text,'-',''),1,12));

  insert into nexora.certificates(user_id,course_id,verification_code,metadata)
  values(
    p_user_id,
    p_course_id,
    v_code,
    jsonb_build_object(
      'issued_by','LC — Learn & Create',
      'version','lc-v1',
      'completion_rules','v1',
      'issued_via','admin',
      'admin_actor_id',auth.uid(),
      'manual_override',v_manual and not coalesce(v_eligible,false),
      'override_reason',case when v_manual and not coalesce(v_eligible,false) then v_reason else null end,
      'eligibility_reason',v_eligibility_reason
    )
  )
  returning id,issued_at into v_id,v_issued_at;

  insert into nexora.admin_audit_log(actor_id,action,target_type,target_id,details)
  values(
    auth.uid(),
    'certificate_admin_issue',
    'certificate',
    v_id,
    jsonb_build_object(
      'user_id',p_user_id,
      'course_id',p_course_id,
      'verification_code',v_code,
      'manual_override',v_manual and not coalesce(v_eligible,false),
      'reason',case when v_manual and not coalesce(v_eligible,false) then v_reason else null end,
      'eligibility_reason',v_eligibility_reason
    )
  );

  return jsonb_build_object(
    'issued',true,
    'already_existed',false,
    'manual_override',v_manual and not coalesce(v_eligible,false),
    'verification_code',v_code,
    'issued_at',v_issued_at
  );
end
$$;

revoke all on function nexora.admin_issue_certificate(uuid,uuid,boolean,text) from public, anon;
grant execute on function nexora.admin_issue_certificate(uuid,uuid,boolean,text) to authenticated;

notify pgrst, 'reload schema';
