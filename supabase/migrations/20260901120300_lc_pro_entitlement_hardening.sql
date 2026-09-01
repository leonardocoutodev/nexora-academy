-- Harden LC Pro content and activity authorization.
-- Applied to production as Supabase migration 20260901120300_lc_pro_entitlement_hardening.

drop policy if exists learning_resources_read_published on nexora.learning_resources;
create policy learning_resources_read_enrolled
on nexora.learning_resources for select
to authenticated
using (
  (select nexora_private.is_admin())
  or (
    status='published'
    and (select nexora_private.is_member())
    and exists(
      select 1 from nexora.enrollments e
      where e.course_id=learning_resources.course_id
        and e.user_id=(select auth.uid())
        and e.status in ('active','completed')
    )
  )
);

drop policy if exists nexora_attempts_self_insert on nexora.assessment_attempts;
create policy nexora_attempts_self_insert
on nexora.assessment_attempts for insert
to authenticated
with check (
  (select auth.uid())=user_id
  and (select nexora_private.is_member())
  and exists(
    select 1
    from nexora.assessments a
    join nexora.enrollments e on e.course_id=a.course_id
    where a.id=assessment_attempts.assessment_id
      and e.user_id=(select auth.uid())
      and e.status in ('active','completed')
  )
);

drop policy if exists nexora_submissions_self_insert on nexora.project_submissions;
create policy nexora_submissions_self_insert
on nexora.project_submissions for insert
to authenticated
with check (
  (select auth.uid())=user_id
  and (select nexora_private.is_member())
  and score is null and feedback is null and reviewed_at is null
  and status in ('draft','submitted')
  and exists(
    select 1
    from nexora.projects p
    join nexora.enrollments e on e.course_id=p.course_id
    where p.id=project_submissions.project_id
      and e.user_id=(select auth.uid())
      and e.status in ('active','completed')
  )
);

drop policy if exists nexora_submissions_self_update on nexora.project_submissions;
create policy nexora_submissions_self_update
on nexora.project_submissions for update
to authenticated
using (
  (select auth.uid())=user_id
  and exists(
    select 1
    from nexora.projects p
    join nexora.enrollments e on e.course_id=p.course_id
    where p.id=project_submissions.project_id
      and e.user_id=(select auth.uid())
      and e.status in ('active','completed')
  )
)
with check (
  (select auth.uid())=user_id
  and score is null and feedback is null and reviewed_at is null
  and status in ('draft','submitted')
  and exists(
    select 1
    from nexora.projects p
    join nexora.enrollments e on e.course_id=p.course_id
    where p.id=project_submissions.project_id
      and e.user_id=(select auth.uid())
      and e.status in ('active','completed')
  )
);

create or replace function nexora.check_assessment_question(p_question_id uuid,p_option_id text)
returns table(correct boolean,feedback text)
language plpgsql
security definer
set search_path='nexora','public'
as $$
declare uid uuid:=auth.uid();
begin
  if uid is null then raise exception 'authentication required'; end if;
  return query
  select
    coalesce(q.correct_answer->>'option_id',q.correct_answer->>'id')=p_option_id,
    case
      when coalesce(q.correct_answer->>'option_id',q.correct_answer->>'id')=p_option_id
        then coalesce(q.feedback_correct,'Correto.')
      else coalesce(q.feedback_incorrect,'Revise este conceito e tente novamente.')
    end
  from nexora.questions q
  join nexora.assessments a on a.id=q.assessment_id
  join nexora.enrollments e on e.course_id=a.course_id and e.user_id=uid and e.status in ('active','completed')
  where q.id=p_question_id and a.status='published';
end $$;

create or replace function nexora.submit_assessment(p_assessment_id uuid,p_answers jsonb)
returns jsonb
language plpgsql
security definer
set search_path='nexora','public'
as $$
declare
  v_user uuid:=auth.uid();
  v_total int;
  v_correct int;
  v_score numeric;
  v_pass numeric;
  v_max int;
  v_attempts int;
  v_id uuid;
begin
  if v_user is null then raise exception 'not_authenticated'; end if;
  select a.pass_score,a.max_attempts into v_pass,v_max
  from nexora.assessments a
  join nexora.enrollments e on e.course_id=a.course_id
  where a.id=p_assessment_id and a.status='published'
    and e.user_id=v_user and e.status in ('active','completed');
  if not found then raise exception 'assessment_not_available'; end if;

  select count(*) into v_attempts
  from nexora.assessment_attempts
  where assessment_id=p_assessment_id and user_id=v_user and submitted_at is not null;
  if v_max is not null and v_attempts>=v_max then raise exception 'max_attempts_reached'; end if;

  select count(*),
         count(*) filter(
           where coalesce(p_answers->>q.id::text,'')=
                 coalesce(q.correct_answer->>'option_id',q.correct_answer->>'id')
         )
    into v_total,v_correct
  from nexora.questions q
  where q.assessment_id=p_assessment_id;

  v_score:=case when v_total=0 then 0 else round((v_correct::numeric/v_total::numeric)*100,2) end;
  insert into nexora.assessment_attempts(assessment_id,user_id,score,answers,submitted_at)
  values(p_assessment_id,v_user,v_score,p_answers,now())
  returning id into v_id;

  return jsonb_build_object('attempt_id',v_id,'score',v_score,'passed',v_score>=v_pass,'pass_score',v_pass,'correct',v_correct,'total',v_total);
end $$;

create or replace function nexora.claim_assessment_xp(p_assessment_id uuid)
returns table(xp_awarded integer,xp_total integer,level integer)
language plpgsql
security definer
set search_path='nexora','public'
as $$
declare uid uuid:=auth.uid(); inserted_count integer:=0; reward integer:=150;
begin
  if uid is null then raise exception 'authentication required'; end if;
  if not exists(
    select 1
    from nexora.assessment_attempts aa
    join nexora.assessments a on a.id=aa.assessment_id
    join nexora.enrollments e on e.course_id=a.course_id and e.user_id=uid and e.status in ('active','completed')
    where aa.user_id=uid and aa.assessment_id=p_assessment_id and aa.score>=a.pass_score
  ) then raise exception 'assessment not passed or unavailable'; end if;

  insert into nexora.xp_events(user_id,event_type,source_type,source_id,xp)
  values(uid,'assessment_pass','assessment',p_assessment_id,reward)
  on conflict do nothing;
  get diagnostics inserted_count=row_count;

  insert into nexora.user_gamification(user_id) values(uid) on conflict do nothing;
  if inserted_count>0 then
    update nexora.user_gamification g set xp_total=g.xp_total+reward,updated_at=now() where g.user_id=uid;
    update nexora.user_gamification g set level=greatest(1,(g.xp_total/500)+1) where g.user_id=uid;
    insert into nexora.user_badges(user_id,badge_id)
    select uid,b.id from nexora.badges b
    where b.code='xp_1000' and (select g.xp_total from nexora.user_gamification g where g.user_id=uid)>=1000
    on conflict do nothing;
  end if;

  return query
  select case when inserted_count>0 then reward else 0 end,g.xp_total,g.level
  from nexora.user_gamification g where g.user_id=uid;
end $$;
