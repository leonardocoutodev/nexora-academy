drop policy if exists course_reviews_self_insert on nexora.course_reviews;
drop policy if exists course_reviews_self_update on nexora.course_reviews;
drop policy if exists course_reviews_admin_update on nexora.course_reviews;

create policy course_reviews_self_insert on nexora.course_reviews
for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and status = 'pending'
  and exists (
    select 1 from nexora.enrollments e
    where e.user_id = (select auth.uid())
      and e.course_id = course_reviews.course_id
      and e.status in ('active','completed')
  )
  and not exists (
    select 1
    from nexora.modules m
    join nexora.lessons l on l.module_id = m.id and l.status = 'published'
    left join nexora.lesson_progress lp on lp.lesson_id = l.id and lp.user_id = (select auth.uid())
    where m.course_id = course_reviews.course_id
      and coalesce(lp.progress,0) < 100
  )
);

create policy course_reviews_self_update on nexora.course_reviews
for update to authenticated
using ((select auth.uid()) = user_id and not (select nexora_private.is_admin()))
with check (
  (select auth.uid()) = user_id
  and status = 'pending'
  and exists (
    select 1 from nexora.enrollments e
    where e.user_id = (select auth.uid())
      and e.course_id = course_reviews.course_id
      and e.status in ('active','completed')
  )
  and not exists (
    select 1
    from nexora.modules m
    join nexora.lessons l on l.module_id = m.id and l.status = 'published'
    left join nexora.lesson_progress lp on lp.lesson_id = l.id and lp.user_id = (select auth.uid())
    where m.course_id = course_reviews.course_id
      and coalesce(lp.progress,0) < 100
  )
);

create policy course_reviews_admin_update on nexora.course_reviews
for update to authenticated
using ((select nexora_private.is_admin()))
with check ((select nexora_private.is_admin()));

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
) returns uuid
language plpgsql
security definer
set search_path to 'nexora','public','auth','nexora_private'
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
    'support_page_viewed','support_cta_clicked','donation_started','donation_checkout_opened','donation_returned',
    'landing_page_viewed','landing_cta_clicked',
    'pro_product_viewed','pro_checkout_started',
    'weekly_goal_changed','lesson_helpfulness_submitted','course_review_submitted',
    'learning_milestone_shared','student_referral_claimed','student_referral_shared',
    'affiliate_promo_copied','affiliate_promo_shared'
  ];
  v_limit integer;
begin
  p_event_name:=lower(trim(coalesce(p_event_name,'')));
  p_session_id:=trim(coalesce(p_session_id,''));
  p_path:=nullif(left(trim(coalesce(p_path,'')),300),'');
  p_device_type:=lower(trim(coalesce(p_device_type,'unknown')));

  if not (p_event_name=any(v_allowed)) then raise exception 'invalid_analytics_event'; end if;
  if p_session_id !~ '^[A-Za-z0-9_-]{16,100}$' then raise exception 'invalid_analytics_session'; end if;
  if v_user is null and p_event_name not in ('signup_started','support_page_viewed','support_cta_clicked','donation_started','donation_checkout_opened','donation_returned','landing_page_viewed','landing_cta_clicked') then
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
  ) values(
    v_user,p_session_id,p_event_name,p_path,p_course_id,p_module_id,p_lesson_id,coalesce(p_properties,'{}'::jsonb),
    p_device_type,p_viewport_width,p_viewport_height
  ) returning id into v_id;
  return v_id;
end
$$;
