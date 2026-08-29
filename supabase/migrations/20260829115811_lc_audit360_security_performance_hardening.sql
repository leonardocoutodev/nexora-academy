
alter table nexora_private.lessons_before_quality_20260828 enable row level security;
alter table nexora_private.projects_before_quality_20260828 enable row level security;
revoke all on table nexora_private.lessons_before_quality_20260828 from public, anon, authenticated;
revoke all on table nexora_private.projects_before_quality_20260828 from public, anon, authenticated;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid='nexora_private.lessons_before_quality_20260828'::regclass and contype='p'
  ) then
    alter table nexora_private.lessons_before_quality_20260828 add primary key (id);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid='nexora_private.projects_before_quality_20260828'::regclass and contype='p'
  ) then
    alter table nexora_private.projects_before_quality_20260828 add primary key (id);
  end if;
end $$;

create index if not exists admin_audit_log_actor_id_idx on nexora.admin_audit_log(actor_id);
create index if not exists donations_user_id_idx on nexora.donations(user_id);
create index if not exists learning_credits_target_module_id_idx on nexora.learning_credits(target_module_id);
create index if not exists learning_path_courses_course_id_idx on nexora.learning_path_courses(course_id);
create index if not exists product_events_module_id_idx on nexora.product_events(module_id);
create index if not exists promotional_events_creative_id_idx on nexora.promotional_events(creative_id);
create index if not exists supporters_user_id_idx on nexora.supporters(user_id);
create index if not exists user_badges_badge_id_idx on nexora.user_badges(badge_id);
create index if not exists user_learning_preferences_preferred_path_id_idx on nexora.user_learning_preferences(preferred_path_id);

drop policy if exists donations_select_own on nexora.donations;
create policy donations_select_own on nexora.donations
for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists supporters_select_own on nexora.supporters;
create policy supporters_select_own on nexora.supporters
for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists promotional_events_insert_authenticated on nexora.promotional_events;
create policy promotional_events_insert_authenticated on nexora.promotional_events
for insert to authenticated
with check (user_id is null or user_id = (select auth.uid()));

create table if not exists nexora_private.public_rate_limits(
  action text not null,
  rate_key text not null,
  window_start timestamptz not null,
  request_count integer not null default 1 check (request_count > 0),
  updated_at timestamptz not null default now(),
  primary key(action,rate_key,window_start)
);
alter table nexora_private.public_rate_limits enable row level security;
revoke all on table nexora_private.public_rate_limits from public,anon,authenticated;

create or replace function nexora_private.consume_public_rate_limit(
  p_action text,
  p_rate_key text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path=nexora_private,pg_catalog
as $$
declare
  v_window timestamptz;
  v_count integer;
begin
  if coalesce(length(trim(p_action)),0)=0 or coalesce(length(trim(p_rate_key)),0)<8 then
    return false;
  end if;
  if p_limit < 1 or p_limit > 10000 or p_window_seconds < 10 or p_window_seconds > 86400 then
    return false;
  end if;

  v_window:=to_timestamp(
    floor(extract(epoch from clock_timestamp()) / p_window_seconds) * p_window_seconds
  );

  insert into nexora_private.public_rate_limits(action,rate_key,window_start,request_count,updated_at)
  values(left(trim(p_action),80),left(trim(p_rate_key),160),v_window,1,now())
  on conflict(action,rate_key,window_start)
  do update set request_count=nexora_private.public_rate_limits.request_count+1,updated_at=now()
  returning request_count into v_count;

  delete from nexora_private.public_rate_limits
  where updated_at < now()-interval '2 days';

  return v_count <= p_limit;
end
$$;
revoke all on function nexora_private.consume_public_rate_limit(text,text,integer,integer) from public,anon,authenticated;
grant execute on function nexora_private.consume_public_rate_limit(text,text,integer,integer) to service_role;

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
set search_path=nexora,public,auth,nexora_private
as $$
declare
  v_user uuid:=auth.uid();
  v_id uuid;
  v_allowed constant text[]:=array[
    'signup_started','signup_completed','login_completed','app_session_started',
    'goal_selected','diagnostic_started','diagnostic_completed','route_recommended',
    'course_opened',
    'lesson_opened','lesson_engagement','lesson_completed',
    'inline_check_answered','lab_opened','lab_completed',
    'quiz_started','quiz_completed',
    'boss_page_viewed','boss_submitted','boss_resubmitted',
    'certificate_page_viewed','certificate_issued',
    'support_page_viewed','support_cta_clicked','donation_started','donation_checkout_opened','donation_returned'
  ];
  v_limit integer;
begin
  p_event_name:=lower(trim(coalesce(p_event_name,'')));
  p_session_id:=trim(coalesce(p_session_id,''));
  p_path:=nullif(left(trim(coalesce(p_path,'')),300),'');
  p_device_type:=lower(trim(coalesce(p_device_type,'unknown')));

  if not (p_event_name=any(v_allowed)) then raise exception 'invalid_analytics_event'; end if;
  if p_session_id !~ '^[A-Za-z0-9_-]{16,100}$' then raise exception 'invalid_analytics_session'; end if;
  if v_user is null and p_event_name not in ('signup_started','support_page_viewed','support_cta_clicked','donation_started','donation_checkout_opened','donation_returned') then
    raise exception 'authentication_required_for_event';
  end if;
  if jsonb_typeof(coalesce(p_properties,'{}'::jsonb))<>'object' then raise exception 'invalid_analytics_properties'; end if;
  if octet_length(coalesce(p_properties,'{}'::jsonb)::text)>4096 then raise exception 'analytics_properties_too_large'; end if;
  if p_device_type not in ('mobile','tablet','desktop','unknown') then p_device_type:='unknown'; end if;

  v_limit:=case when v_user is null then 20 else 180 end;
  if not nexora_private.consume_public_rate_limit('analytics:'||p_event_name,p_session_id,v_limit,60) then
    raise exception 'analytics_rate_limited';
  end if;

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
$$;
