-- LC Phase 4 — track authenticated app sessions.
begin;

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
    'signup_started','signup_completed','login_completed','app_session_started',
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

commit;
