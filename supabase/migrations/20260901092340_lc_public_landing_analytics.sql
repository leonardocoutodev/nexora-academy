create or replace function nexora.track_product_event(
  p_event_name text,
  p_session_id text,
  p_path text default null::text,
  p_course_id uuid default null::uuid,
  p_module_id uuid default null::uuid,
  p_lesson_id uuid default null::uuid,
  p_properties jsonb default '{}'::jsonb,
  p_device_type text default 'unknown'::text,
  p_viewport_width integer default null::integer,
  p_viewport_height integer default null::integer
)
returns uuid
language plpgsql
security definer
set search_path to 'nexora','public','auth','nexora_private'
as $function$
declare
  v_user uuid:=auth.uid();
  v_id uuid;
  v_allowed constant text[]:=array[
    'landing_page_viewed','landing_cta_clicked',
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
  if v_user is null and p_event_name not in ('landing_page_viewed','landing_cta_clicked','signup_started','support_page_viewed','support_cta_clicked','donation_started','donation_checkout_opened','donation_returned') then
    raise exception 'authentication_required_for_event';
  end if;
  if jsonb_typeof(coalesce(p_properties,'{}'::jsonb))<>'object' then raise exception 'invalid_analytics_properties'; end if;
  if octet_length(coalesce(p_properties,'{}'::jsonb)::text)>4096 then raise exception 'analytics_properties_too_large'; end if;
  if p_device_type not in ('mobile','tablet','desktop','unknown') then p_device_type:='unknown'; end if;

  v_limit:=case when v_user is null then 20 else 180 end;
  if not nexora_private.consume_public_rate_limit('analytics:'||p_event_name,p_session_id,v_limit,60) then
    raise exception 'analytics_rate_limited';
  end if;

  insert into nexora.product_events(user_id,session_id,event_name,path,course_id,module_id,lesson_id,properties,device_type,viewport_width,viewport_height)
  values(v_user,p_session_id,p_event_name,p_path,p_course_id,p_module_id,p_lesson_id,coalesce(p_properties,'{}'::jsonb),p_device_type,p_viewport_width,p_viewport_height)
  returning id into v_id;

  return v_id;
end
$function$;

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
      ('Página de vendas',1,array['landing_page_viewed']::text[]),
      ('Cadastro iniciado',2,array['signup_started']::text[]),
      ('Acesso autenticado',3,array['signup_completed','login_completed']::text[]),
      ('Diagnóstico concluído',4,array['diagnostic_completed']::text[]),
      ('Curso aberto',5,array['course_opened']::text[]),
      ('Aula aberta',6,array['lesson_opened']::text[]),
      ('Aula concluída',7,array['lesson_completed']::text[]),
      ('Boss Fight enviada',8,array['boss_submitted','boss_resubmitted']::text[]),
      ('Certificado emitido',9,array['certificate_issued']::text[])
  )
  select s.stage,s.stage_order,count(distinct b.person_key)::bigint
  from stages s left join base b on b.event_name=any(s.names)
  group by s.stage,s.stage_order order by s.stage_order;
end
$function$;

create or replace function nexora.admin_analytics_public_visitors(p_days integer default 30)
returns table(session_id text, visitor_type text, user_id uuid, full_name text, first_seen timestamptz, last_seen timestamptz, page_views bigint, cta_clicks bigint, device_type text, referrer_host text, utm_source text, utm_campaign text)
language plpgsql
security definer
set search_path to 'nexora','public','auth'
as $function$
declare
  v_since timestamptz:=now()-(greatest(1,least(coalesce(p_days,30),365))||' days')::interval;
begin
  if auth.uid() is null or not nexora_private.is_admin() then raise exception 'admin_required'; end if;
  return query
  with landing as (
    select e.session_id,
           max(e.user_id) as user_id,
           min(e.created_at) as first_seen,
           max(e.created_at) as last_seen,
           count(*) filter(where e.event_name='landing_page_viewed')::bigint as page_views,
           count(*) filter(where e.event_name='landing_cta_clicked')::bigint as cta_clicks,
           (array_agg(e.device_type order by e.created_at desc))[1] as device_type,
           (array_agg(nullif(e.properties->>'referrer_host','') order by e.created_at desc) filter(where nullif(e.properties->>'referrer_host','') is not null))[1] as referrer_host,
           (array_agg(nullif(e.properties->>'utm_source','') order by e.created_at desc) filter(where nullif(e.properties->>'utm_source','') is not null))[1] as utm_source,
           (array_agg(nullif(e.properties->>'utm_campaign','') order by e.created_at desc) filter(where nullif(e.properties->>'utm_campaign','') is not null))[1] as utm_campaign
    from nexora.product_events e
    where e.created_at>=v_since and e.event_name in ('landing_page_viewed','landing_cta_clicked')
    group by e.session_id
  )
  select l.session_id,
         case when l.user_id is null then 'anonymous' else 'identified' end,
         l.user_id,p.full_name,l.first_seen,l.last_seen,l.page_views,l.cta_clicks,l.device_type,l.referrer_host,l.utm_source,l.utm_campaign
  from landing l left join nexora.profiles p on p.id=l.user_id
  order by l.last_seen desc;
end
$function$;

grant execute on function nexora.admin_analytics_public_visitors(integer) to authenticated;
