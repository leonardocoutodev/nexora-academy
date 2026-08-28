-- LC Phase 4 — product and learning analytics.
begin;

create table if not exists nexora.product_events(
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  session_id text not null,
  event_name text not null,
  path text,
  course_id uuid references nexora.courses(id) on delete set null,
  module_id uuid references nexora.modules(id) on delete set null,
  lesson_id uuid references nexora.lessons(id) on delete set null,
  properties jsonb not null default '{}'::jsonb,
  device_type text not null default 'unknown',
  viewport_width integer,
  viewport_height integer,
  created_at timestamptz not null default now(),
  constraint product_events_session_check check (char_length(session_id) between 16 and 100),
  constraint product_events_name_check check (char_length(event_name) between 3 and 64),
  constraint product_events_path_check check (path is null or char_length(path)<=300),
  constraint product_events_device_check check (device_type in ('mobile','tablet','desktop','unknown')),
  constraint product_events_viewport_width_check check (viewport_width is null or viewport_width between 1 and 10000),
  constraint product_events_viewport_height_check check (viewport_height is null or viewport_height between 1 and 10000)
);

alter table nexora.product_events enable row level security;
revoke all on nexora.product_events from anon,authenticated;

create index if not exists product_events_created_at_idx on nexora.product_events(created_at desc);
create index if not exists product_events_name_created_idx on nexora.product_events(event_name,created_at desc);
create index if not exists product_events_user_created_idx on nexora.product_events(user_id,created_at desc) where user_id is not null;
create index if not exists product_events_session_created_idx on nexora.product_events(session_id,created_at desc);
create index if not exists product_events_course_created_idx on nexora.product_events(course_id,created_at desc) where course_id is not null;
create index if not exists product_events_lesson_created_idx on nexora.product_events(lesson_id,created_at desc) where lesson_id is not null;

create or replace function nexora.track_product_event(
  p_event_name text,
  p_session_id text,
  p_path text default null,
  p_course_id uuid default null,
  p_module_id uuid default null,
  p_lesson_id uuid default null,
  p_properties jsonb default '{}'::jsonb,
  p_device_type text default 'unknown',
  p_viewport_width integer default null,
  p_viewport_height integer default null
)
returns uuid
language plpgsql
security definer
set search_path to 'nexora','public','auth'
as $function$
declare
  v_user uuid:=auth.uid();
  v_id uuid;
  v_allowed constant text[]:=array[
    'signup_started','signup_completed','login_completed',
    'goal_selected','diagnostic_started','diagnostic_completed','route_recommended',
    'course_opened',
    'lesson_opened','lesson_engagement','lesson_completed',
    'inline_check_answered','lab_opened','lab_completed',
    'quiz_started','quiz_completed',
    'boss_page_viewed','boss_submitted','boss_resubmitted',
    'certificate_page_viewed','certificate_issued'
  ];
begin
  p_event_name:=lower(trim(coalesce(p_event_name,'')));
  p_session_id:=trim(coalesce(p_session_id,''));
  p_path:=nullif(left(trim(coalesce(p_path,'')),300),'');
  p_device_type:=lower(trim(coalesce(p_device_type,'unknown')));

  if not (p_event_name=any(v_allowed)) then raise exception 'invalid_analytics_event'; end if;
  if p_session_id !~ '^[A-Za-z0-9_-]{16,100}$' then raise exception 'invalid_analytics_session'; end if;
  if v_user is null and p_event_name<>'signup_started' then raise exception 'authentication_required_for_event'; end if;
  if jsonb_typeof(coalesce(p_properties,'{}'::jsonb))<>'object' then raise exception 'invalid_analytics_properties'; end if;
  if octet_length(coalesce(p_properties,'{}'::jsonb)::text)>4096 then raise exception 'analytics_properties_too_large'; end if;
  if p_device_type not in ('mobile','tablet','desktop','unknown') then p_device_type:='unknown'; end if;

  insert into nexora.product_events(
    user_id,session_id,event_name,path,course_id,module_id,lesson_id,properties,
    device_type,viewport_width,viewport_height
  )
  values(
    v_user,p_session_id,p_event_name,p_path,p_course_id,p_module_id,p_lesson_id,coalesce(p_properties,'{}'::jsonb),
    p_device_type,p_viewport_width,p_viewport_height
  )
  returning id into v_id;

  return v_id;
end
$function$;

revoke all on function nexora.track_product_event(text,text,text,uuid,uuid,uuid,jsonb,text,integer,integer) from public;
grant execute on function nexora.track_product_event(text,text,text,uuid,uuid,uuid,jsonb,text,integer,integer) to anon,authenticated;

create or replace function nexora.identify_analytics_session(p_session_id text)
returns integer
language plpgsql
security definer
set search_path to 'nexora','public','auth'
as $function$
declare
  v_user uuid:=auth.uid();
  v_count integer:=0;
begin
  if v_user is null then raise exception 'authentication required'; end if;
  p_session_id:=trim(coalesce(p_session_id,''));
  if p_session_id !~ '^[A-Za-z0-9_-]{16,100}$' then raise exception 'invalid_analytics_session'; end if;

  update nexora.product_events
  set user_id=v_user
  where session_id=p_session_id
    and user_id is null
    and created_at>=now()-interval '7 days';
  get diagnostics v_count=row_count;
  return v_count;
end
$function$;

revoke all on function nexora.identify_analytics_session(text) from public,anon;
grant execute on function nexora.identify_analytics_session(text) to authenticated;

create or replace function nexora.admin_analytics_overview(p_days integer default 30)
returns jsonb
language plpgsql
security definer
set search_path to 'nexora','public','auth'
as $function$
declare
  v_days integer:=greatest(1,least(coalesce(p_days,30),365));
  v_since timestamptz;
  v jsonb;
begin
  if auth.uid() is null or not nexora_private.is_admin() then raise exception 'admin_required'; end if;
  v_since:=now()-(v_days||' days')::interval;

  select jsonb_build_object(
    'window_days',v_days,
    'instrumented_since',(select min(created_at) from nexora.product_events),
    'events',(select count(*) from nexora.product_events e where e.created_at>=v_since),
    'sessions',(select count(distinct session_id) from nexora.product_events e where e.created_at>=v_since),
    'active_users',(select count(distinct user_id) from nexora.product_events e where e.created_at>=v_since and e.user_id is not null),
    'active_users_7d',(select count(distinct user_id) from nexora.product_events e where e.created_at>=now()-interval '7 days' and e.user_id is not null),
    'lesson_opens',(select count(*) from nexora.product_events e where e.created_at>=v_since and e.event_name='lesson_opened'),
    'lesson_completions',(select count(*) from nexora.product_events e where e.created_at>=v_since and e.event_name='lesson_completed'),
    'avg_engagement_minutes',coalesce((
      select round(avg(least(1800,greatest(0,coalesce((e.properties->>'duration_seconds')::numeric,0))))/60,1)
      from nexora.product_events e
      where e.created_at>=v_since and e.event_name='lesson_engagement'
    ),0),
    'quiz_pass_rate',coalesce((
      select round(100.0*count(*) filter(where coalesce((e.properties->>'passed')::boolean,false))/nullif(count(*),0),1)
      from nexora.product_events e
      where e.created_at>=v_since and e.event_name='quiz_completed'
    ),0),
    'boss_submissions',(select count(*) from nexora.product_events e where e.created_at>=v_since and e.event_name in ('boss_submitted','boss_resubmitted')),
    'certificates_issued',(select count(*) from nexora.product_events e where e.created_at>=v_since and e.event_name='certificate_issued'),
    'mobile_share',coalesce((
      select round(100.0*count(distinct session_id) filter(where device_type='mobile')/nullif(count(distinct session_id),0),1)
      from nexora.product_events e where e.created_at>=v_since
    ),0)
  ) into v;

  return v;
end
$function$;

revoke all on function nexora.admin_analytics_overview(integer) from public,anon;
grant execute on function nexora.admin_analytics_overview(integer) to authenticated;

create or replace function nexora.admin_analytics_funnel(p_days integer default 30)
returns table(stage text, stage_order integer, people bigint)
language plpgsql
security definer
set search_path to 'nexora','public','auth'
as $function$
declare
  v_days integer:=greatest(1,least(coalesce(p_days,30),365));
  v_since timestamptz:=now()-(greatest(1,least(coalesce(p_days,30),365))||' days')::interval;
begin
  if auth.uid() is null or not nexora_private.is_admin() then raise exception 'admin_required'; end if;

  return query
  with base as (
    select event_name,coalesce(user_id::text,'session:'||session_id) person_key
    from nexora.product_events
    where created_at>=v_since
  ), stages(stage,stage_order,names) as (
    values
      ('Cadastro iniciado',1,array['signup_started']::text[]),
      ('Acesso autenticado',2,array['signup_completed','login_completed']::text[]),
      ('Diagnóstico concluído',3,array['diagnostic_completed']::text[]),
      ('Curso aberto',4,array['course_opened']::text[]),
      ('Aula aberta',5,array['lesson_opened']::text[]),
      ('Aula concluída',6,array['lesson_completed']::text[]),
      ('Boss Fight enviada',7,array['boss_submitted','boss_resubmitted']::text[]),
      ('Certificado emitido',8,array['certificate_issued']::text[])
  )
  select s.stage,s.stage_order,count(distinct b.person_key)::bigint
  from stages s
  left join base b on b.event_name=any(s.names)
  group by s.stage,s.stage_order
  order by s.stage_order;
end
$function$;

revoke all on function nexora.admin_analytics_funnel(integer) from public,anon;
grant execute on function nexora.admin_analytics_funnel(integer) to authenticated;

create or replace function nexora.admin_analytics_daily(p_days integer default 30)
returns table(
  day date,
  active_users bigint,
  sessions bigint,
  events bigint,
  lesson_opens bigint,
  lesson_completions bigint,
  engagement_minutes numeric
)
language plpgsql
security definer
set search_path to 'nexora','public','auth'
as $function$
declare
  v_days integer:=greatest(1,least(coalesce(p_days,30),365));
begin
  if auth.uid() is null or not nexora_private.is_admin() then raise exception 'admin_required'; end if;
  return query
  with days as (
    select generate_series(current_date-(v_days-1),current_date,'1 day')::date d
  ), agg as (
    select created_at::date d,
      count(distinct user_id) filter(where user_id is not null) active_users,
      count(distinct session_id) sessions,
      count(*) events,
      count(*) filter(where event_name='lesson_opened') lesson_opens,
      count(*) filter(where event_name='lesson_completed') lesson_completions,
      coalesce(sum(least(1800,greatest(0,coalesce((properties->>'duration_seconds')::numeric,0)))) filter(where event_name='lesson_engagement')/60,0) engagement_minutes
    from nexora.product_events
    where created_at>=current_date-(v_days-1)
    group by created_at::date
  )
  select days.d,coalesce(a.active_users,0),coalesce(a.sessions,0),coalesce(a.events,0),
         coalesce(a.lesson_opens,0),coalesce(a.lesson_completions,0),round(coalesce(a.engagement_minutes,0),1)
  from days left join agg a on a.d=days.d order by days.d;
end
$function$;

revoke all on function nexora.admin_analytics_daily(integer) from public,anon;
grant execute on function nexora.admin_analytics_daily(integer) to authenticated;

create or replace function nexora.admin_analytics_courses(p_days integer default 30)
returns table(
  course_id uuid,
  course_title text,
  enrollments bigint,
  active_learners bigint,
  course_opens bigint,
  lesson_opens bigint,
  lesson_completions bigint,
  avg_quiz_score numeric,
  quiz_pass_rate numeric,
  boss_submissions bigint,
  certificates bigint,
  engagement_minutes numeric
)
language plpgsql
security definer
set search_path to 'nexora','public','auth'
as $function$
declare
  v_days integer:=greatest(1,least(coalesce(p_days,30),365));
  v_since timestamptz:=now()-(greatest(1,least(coalesce(p_days,30),365))||' days')::interval;
begin
  if auth.uid() is null or not nexora_private.is_admin() then raise exception 'admin_required'; end if;

  return query
  select c.id,c.title,
    (select count(*) from nexora.enrollments en where en.course_id=c.id),
    (select count(distinct lp.user_id)
       from nexora.lesson_progress lp join nexora.lessons l on l.id=lp.lesson_id join nexora.modules m on m.id=l.module_id
       where m.course_id=c.id and lp.updated_at>=v_since and lp.progress>0),
    (select count(*) from nexora.product_events e where e.course_id=c.id and e.created_at>=v_since and e.event_name='course_opened'),
    (select count(*) from nexora.product_events e where e.course_id=c.id and e.created_at>=v_since and e.event_name='lesson_opened'),
    (select count(*) from nexora.product_events e where e.course_id=c.id and e.created_at>=v_since and e.event_name='lesson_completed'),
    coalesce((select round(avg(aa.score),1) from nexora.assessment_attempts aa join nexora.assessments a on a.id=aa.assessment_id where a.course_id=c.id and aa.submitted_at>=v_since),0),
    coalesce((select round(100.0*count(*) filter(where aa.score>=a.pass_score)/nullif(count(*),0),1) from nexora.assessment_attempts aa join nexora.assessments a on a.id=aa.assessment_id where a.course_id=c.id and aa.submitted_at>=v_since),0),
    (select count(*) from nexora.project_submissions ps join nexora.projects p on p.id=ps.project_id where p.course_id=c.id and ps.submitted_at>=v_since),
    (select count(*) from nexora.certificates cert where cert.course_id=c.id and cert.issued_at>=v_since),
    coalesce((select round(sum(least(1800,greatest(0,coalesce((e.properties->>'duration_seconds')::numeric,0))))/60,1) from nexora.product_events e where e.course_id=c.id and e.created_at>=v_since and e.event_name='lesson_engagement'),0)
  from nexora.courses c
  where c.status='published'
  order by c.position;
end
$function$;

revoke all on function nexora.admin_analytics_courses(integer) from public,anon;
grant execute on function nexora.admin_analytics_courses(integer) to authenticated;

create or replace function nexora.admin_analytics_lessons(p_course_id uuid, p_days integer default 30)
returns table(
  lesson_id uuid,
  module_title text,
  lesson_title text,
  lesson_position integer,
  opens bigint,
  unique_learners bigint,
  completions bigint,
  completion_from_opens numeric,
  avg_engagement_seconds numeric,
  avg_scroll_percent numeric,
  inline_checks bigint,
  inline_correct_rate numeric,
  lab_completions bigint
)
language plpgsql
security definer
set search_path to 'nexora','public','auth'
as $function$
declare
  v_days integer:=greatest(1,least(coalesce(p_days,30),365));
  v_since timestamptz:=now()-(greatest(1,least(coalesce(p_days,30),365))||' days')::interval;
begin
  if auth.uid() is null or not nexora_private.is_admin() then raise exception 'admin_required'; end if;

  return query
  select l.id,m.title,l.title,l.position,
    count(e.id) filter(where e.event_name='lesson_opened')::bigint,
    count(distinct e.user_id) filter(where e.event_name='lesson_opened' and e.user_id is not null)::bigint,
    count(e.id) filter(where e.event_name='lesson_completed')::bigint,
    coalesce(round(100.0*count(e.id) filter(where e.event_name='lesson_completed')/nullif(count(e.id) filter(where e.event_name='lesson_opened'),0),1),0),
    coalesce(round(avg(least(1800,greatest(0,coalesce((e.properties->>'duration_seconds')::numeric,0)))) filter(where e.event_name='lesson_engagement'),1),0),
    coalesce(round(avg(least(100,greatest(0,coalesce((e.properties->>'max_scroll_percent')::numeric,0)))) filter(where e.event_name='lesson_engagement'),1),0),
    count(e.id) filter(where e.event_name='inline_check_answered')::bigint,
    coalesce(round(100.0*count(e.id) filter(where e.event_name='inline_check_answered' and coalesce((e.properties->>'correct')::boolean,false))/nullif(count(e.id) filter(where e.event_name='inline_check_answered'),0),1),0),
    count(e.id) filter(where e.event_name='lab_completed')::bigint
  from nexora.lessons l
  join nexora.modules m on m.id=l.module_id
  left join nexora.product_events e on e.lesson_id=l.id and e.created_at>=v_since
  where m.course_id=p_course_id and l.status='published'
  group by l.id,m.position,m.title,l.position,l.title
  order by m.position,l.position;
end
$function$;

revoke all on function nexora.admin_analytics_lessons(uuid,integer) from public,anon;
grant execute on function nexora.admin_analytics_lessons(uuid,integer) to authenticated;

create or replace function nexora.admin_analytics_devices(p_days integer default 30)
returns table(device_type text, sessions bigint, active_users bigint, events bigint)
language plpgsql
security definer
set search_path to 'nexora','public','auth'
as $function$
declare
  v_days integer:=greatest(1,least(coalesce(p_days,30),365));
  v_since timestamptz:=now()-(greatest(1,least(coalesce(p_days,30),365))||' days')::interval;
begin
  if auth.uid() is null or not nexora_private.is_admin() then raise exception 'admin_required'; end if;
  return query
  select e.device_type,count(distinct e.session_id),count(distinct e.user_id) filter(where e.user_id is not null),count(*)
  from nexora.product_events e
  where e.created_at>=v_since
  group by e.device_type
  order by count(distinct e.session_id) desc;
end
$function$;

revoke all on function nexora.admin_analytics_devices(integer) from public,anon;
grant execute on function nexora.admin_analytics_devices(integer) to authenticated;

create or replace function nexora.admin_analytics_goals()
returns table(goal text, learners bigint, avg_diagnostic_score numeric, mastered bigint, recommended bigint, strongly_recommended bigint)
language plpgsql
security definer
set search_path to 'nexora','public','auth'
as $function$
begin
  if auth.uid() is null or not nexora_private.is_admin() then raise exception 'admin_required'; end if;
  return query
  select coalesce(p.goal,'não informado')::text,count(*)::bigint,coalesce(round(avg(p.diagnostic_score),1),0),
    count(*) filter(where p.foundation_status in ('mastered','completed'))::bigint,
    count(*) filter(where p.foundation_status='recommended')::bigint,
    count(*) filter(where p.foundation_status='strongly_recommended')::bigint
  from nexora.user_learning_preferences p
  group by coalesce(p.goal,'não informado')
  order by count(*) desc;
end
$function$;

revoke all on function nexora.admin_analytics_goals() from public,anon;
grant execute on function nexora.admin_analytics_goals() to authenticated;

commit;
