
create table if not exists nexora.weekly_goals(
  user_id uuid primary key references auth.users(id) on delete cascade,
  target_lessons integer not null default 3 check(target_lessons between 1 and 21),
  updated_at timestamptz not null default now()
);

create table if not exists nexora.lesson_feedback(
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references nexora.lessons(id) on delete cascade,
  helpful boolean not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(user_id,lesson_id)
);

create table if not exists nexora.course_reviews(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references nexora.courses(id) on delete cascade,
  rating integer not null check(rating between 1 and 5),
  comment text check(comment is null or length(comment)<=1200),
  consent_public boolean not null default false,
  status text not null default 'pending' check(status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id,course_id)
);

create table if not exists nexora.student_referral_codes(
  user_id uuid primary key references auth.users(id) on delete cascade,
  code text not null unique check(code ~ '^LCF[A-Z0-9]{9}$'),
  created_at timestamptz not null default now()
);

create table if not exists nexora.student_referrals(
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null references auth.users(id) on delete cascade,
  referred_user_id uuid not null unique references auth.users(id) on delete cascade,
  code text not null,
  created_at timestamptz not null default now(),
  check(referrer_user_id<>referred_user_id)
);

create index if not exists student_referrals_referrer_idx
  on nexora.student_referrals(referrer_user_id,created_at desc);
create index if not exists course_reviews_status_created_idx
  on nexora.course_reviews(status,created_at desc);
create index if not exists lesson_feedback_lesson_helpful_idx
  on nexora.lesson_feedback(lesson_id,helpful);

alter table nexora.weekly_goals enable row level security;
alter table nexora.lesson_feedback enable row level security;
alter table nexora.course_reviews enable row level security;
alter table nexora.student_referral_codes enable row level security;
alter table nexora.student_referrals enable row level security;

revoke all on nexora.weekly_goals,nexora.lesson_feedback,nexora.course_reviews,nexora.student_referral_codes,nexora.student_referrals from anon,authenticated;
grant select on nexora.course_reviews to anon;
grant select,insert,update on nexora.course_reviews to authenticated;
grant select,insert,update on nexora.lesson_feedback,nexora.weekly_goals to authenticated;
grant select on nexora.student_referral_codes,nexora.student_referrals to authenticated;
grant all on nexora.weekly_goals,nexora.lesson_feedback,nexora.course_reviews,nexora.student_referral_codes,nexora.student_referrals to service_role;

drop policy if exists weekly_goals_self on nexora.weekly_goals;
create policy weekly_goals_self on nexora.weekly_goals
for all to authenticated
using((select auth.uid())=user_id)
with check((select auth.uid())=user_id);

drop policy if exists lesson_feedback_self on nexora.lesson_feedback;
create policy lesson_feedback_self on nexora.lesson_feedback
for all to authenticated
using((select auth.uid())=user_id)
with check((select auth.uid())=user_id);

drop policy if exists student_referral_codes_self on nexora.student_referral_codes;
create policy student_referral_codes_self on nexora.student_referral_codes
for select to authenticated
using(((select auth.uid())=user_id) or (select nexora_private.is_admin()));

drop policy if exists student_referrals_participant_read on nexora.student_referrals;
create policy student_referrals_participant_read on nexora.student_referrals
for select to authenticated
using(
  ((select auth.uid())=referrer_user_id)
  or ((select auth.uid())=referred_user_id)
  or (select nexora_private.is_admin())
);

create or replace function nexora_private.can_review_course(p_user_id uuid,p_course_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path='nexora','nexora_private','public'
as $$
declare ok boolean:=false;
begin
  if p_user_id is null or p_course_id is null then return false; end if;
  select eligible into ok
  from nexora_private.certificate_eligibility_for(p_user_id,p_course_id)
  limit 1;
  return coalesce(ok,false);
exception when others then
  return false;
end $$;
revoke all on function nexora_private.can_review_course(uuid,uuid) from public,anon;
grant execute on function nexora_private.can_review_course(uuid,uuid) to authenticated,service_role;

drop policy if exists course_reviews_public_read on nexora.course_reviews;
drop policy if exists course_reviews_self_select on nexora.course_reviews;
drop policy if exists course_reviews_self_insert on nexora.course_reviews;
drop policy if exists course_reviews_self_update on nexora.course_reviews;
drop policy if exists course_reviews_admin_update on nexora.course_reviews;
drop policy if exists course_reviews_update on nexora.course_reviews;

create policy course_reviews_public_read on nexora.course_reviews
for select to anon
using(status='approved' and consent_public=true);

create policy course_reviews_self_select on nexora.course_reviews
for select to authenticated
using(
  (select auth.uid())=user_id
  or (status='approved' and consent_public=true)
  or (select nexora_private.is_admin())
);

create policy course_reviews_self_insert on nexora.course_reviews
for insert to authenticated
with check(
  (select auth.uid())=user_id
  and status='pending'
  and nexora_private.can_review_course((select auth.uid()),course_id)
);

create policy course_reviews_update on nexora.course_reviews
for update to authenticated
using(
  (select auth.uid())=user_id
  or (select nexora_private.is_admin())
)
with check(
  (
    (select auth.uid())=user_id
    and status='pending'
    and nexora_private.can_review_course((select auth.uid()),course_id)
  )
  or (select nexora_private.is_admin())
);

insert into nexora.badges(code,title,description,icon,xp_reward)
values('community_inviter','Conexão que ensina','Concedido ao convidar a primeira pessoa que cria conta na LC.','↗',100)
on conflict(code) do update
set title=excluded.title,description=excluded.description,icon=excluded.icon,xp_reward=excluded.xp_reward;

create or replace function nexora.weekly_goal_status()
returns jsonb
language plpgsql
security invoker
set search_path='nexora','auth','public'
as $$
declare
  uid uuid:=auth.uid();
  target integer;
  done_count integer;
  start_week timestamptz:=(date_trunc('week',now() at time zone 'America/Bahia') at time zone 'America/Bahia');
begin
  if uid is null then raise exception 'authentication_required'; end if;
  insert into nexora.weekly_goals(user_id,target_lessons)
  values(uid,3)
  on conflict(user_id) do nothing;
  select target_lessons into target from nexora.weekly_goals where user_id=uid;
  select count(*) into done_count
  from nexora.lesson_progress
  where user_id=uid and progress>=100
    and completed_at>=start_week
    and completed_at<start_week+interval '7 days';
  return jsonb_build_object(
    'target_lessons',target,
    'completed_lessons',done_count,
    'week_start',start_week,
    'week_end',start_week+interval '7 days',
    'completed',done_count>=target
  );
end $$;

create or replace function nexora.set_weekly_goal(p_target integer)
returns jsonb
language plpgsql
security invoker
set search_path='nexora','auth','public'
as $$
declare uid uuid:=auth.uid();
begin
  if uid is null then raise exception 'authentication_required'; end if;
  if p_target<1 or p_target>21 then raise exception 'invalid_weekly_goal'; end if;
  insert into nexora.weekly_goals(user_id,target_lessons,updated_at)
  values(uid,p_target,now())
  on conflict(user_id) do update
  set target_lessons=excluded.target_lessons,updated_at=now();
  return nexora.weekly_goal_status();
end $$;

revoke all on function nexora.weekly_goal_status() from public,anon;
revoke all on function nexora.set_weekly_goal(integer) from public,anon;
grant execute on function nexora.weekly_goal_status() to authenticated,service_role;
grant execute on function nexora.set_weekly_goal(integer) to authenticated,service_role;

create or replace function nexora.student_referral_link()
returns jsonb
language plpgsql
security definer
set search_path='nexora','nexora_private','auth','public'
as $$
declare uid uuid:=auth.uid(); vcode text; tries integer:=0;
begin
  if uid is null then raise exception 'authentication_required'; end if;
  if not nexora_private.is_member() then raise exception 'member_required'; end if;
  select code into vcode from nexora.student_referral_codes where user_id=uid;
  if vcode is null then
    loop
      tries:=tries+1;
      vcode:='LCF'||upper(substr(md5(gen_random_uuid()::text),1,9));
      exit when not exists(select 1 from nexora.student_referral_codes where code=vcode);
      if tries>10 then raise exception 'referral_code_generation_failed'; end if;
    end loop;
    insert into nexora.student_referral_codes(user_id,code) values(uid,vcode);
  end if;
  return jsonb_build_object(
    'code',vcode,
    'url','https://academy.learnandcreate.workers.dev/?ref_student='||vcode||'&utm_source=student_referral&utm_medium=referral&utm_campaign=lc_free',
    'successful_referrals',(select count(*) from nexora.student_referrals where referrer_user_id=uid)
  );
end $$;

create or replace function nexora.claim_student_referral(p_code text)
returns jsonb
language plpgsql
security definer
set search_path='nexora','nexora_private','auth','public'
as $$
declare uid uuid:=auth.uid(); referrer uuid; inserted_id uuid; badge_id uuid; reward integer:=100; normalized text;
begin
  if uid is null then raise exception 'authentication_required'; end if;
  normalized:=upper(trim(coalesce(p_code,'')));
  if normalized !~ '^LCF[A-Z0-9]{9}$' then return jsonb_build_object('claimed',false,'reason','invalid_code'); end if;
  select user_id into referrer from nexora.student_referral_codes where code=normalized;
  if referrer is null then return jsonb_build_object('claimed',false,'reason','code_not_found'); end if;
  if referrer=uid then return jsonb_build_object('claimed',false,'reason','self_referral_blocked'); end if;
  if exists(select 1 from nexora.student_referrals where referred_user_id=uid) then return jsonb_build_object('claimed',false,'reason','already_attributed'); end if;
  insert into nexora.student_referrals(referrer_user_id,referred_user_id,code)
  values(referrer,uid,normalized)
  on conflict(referred_user_id) do nothing returning id into inserted_id;
  if inserted_id is null then return jsonb_build_object('claimed',false,'reason','already_attributed'); end if;
  if (select count(*) from nexora.student_referrals where referrer_user_id=referrer)=1 then
    select id,xp_reward into badge_id,reward from nexora.badges where code='community_inviter';
    if badge_id is not null then
      insert into nexora.user_badges(user_id,badge_id) values(referrer,badge_id) on conflict do nothing;
      insert into nexora.user_gamification(user_id,xp_total,level,current_streak,longest_streak,updated_at)
      values(referrer,coalesce(reward,100),1,0,0,now())
      on conflict(user_id) do update
      set xp_total=nexora.user_gamification.xp_total+coalesce(reward,100),
          level=greatest(1,((nexora.user_gamification.xp_total+coalesce(reward,100))/500)+1),
          updated_at=now();
    end if;
  end if;
  return jsonb_build_object('claimed',true,'referrer_user_id',referrer);
end $$;

revoke all on function nexora.student_referral_link() from public,anon;
revoke all on function nexora.claim_student_referral(text) from public,anon;
grant execute on function nexora.student_referral_link() to authenticated,service_role;
grant execute on function nexora.claim_student_referral(text) to authenticated,service_role;

create or replace function nexora.admin_course_review_roster(p_status text default null)
returns table(
  review_id uuid,user_id uuid,student_name text,course_id uuid,course_title text,
  rating integer,comment text,consent_public boolean,status text,
  created_at timestamptz,updated_at timestamptz
)
language plpgsql
security definer
set search_path='nexora','nexora_private','auth','public'
as $$
begin
  if auth.uid() is null or not nexora_private.is_admin() then raise exception 'admin_required'; end if;
  return query
  select r.id,r.user_id,coalesce(p.full_name,'Aluno LC'),r.course_id,c.title,r.rating,r.comment,r.consent_public,r.status,r.created_at,r.updated_at
  from nexora.course_reviews r
  join nexora.courses c on c.id=r.course_id
  left join nexora.profiles p on p.id=r.user_id
  where p_status is null or r.status=p_status
  order by case r.status when 'pending' then 0 when 'approved' then 1 else 2 end,r.created_at desc
  limit 200;
end $$;
revoke all on function nexora.admin_course_review_roster(text) from public,anon;
grant execute on function nexora.admin_course_review_roster(text) to authenticated,service_role;

create or replace function nexora.admin_growth_summary(p_days integer default 30)
returns jsonb
language plpgsql
security definer
set search_path='nexora','nexora_private','auth','public'
as $$
declare d integer:=greatest(1,least(coalesce(p_days,30),365)); since_ts timestamptz:=now()-make_interval(days=>d);
begin
 if auth.uid() is null or not nexora_private.is_admin() then raise exception 'admin_required'; end if;
 return jsonb_build_object(
   'window_days',d,
   'acquisition',jsonb_build_object(
     'sessions',(select count(distinct pe.session_id) from nexora.product_events pe left join nexora.profiles p on p.id=pe.user_id where pe.created_at>=since_ts and coalesce(p.role,'student')<>'admin' and coalesce(pe.path,'') not like '/pages/admin%'),
     'landing_views',(select count(*) from nexora.product_events pe left join nexora.profiles p on p.id=pe.user_id where pe.created_at>=since_ts and pe.event_name in ('landing_page_viewed','public_catalog_viewed','public_course_viewed','public_lesson_preview_viewed','public_boss_demo_viewed','public_certificate_demo_viewed','public_library_viewed','public_article_viewed','pro_public_page_viewed') and coalesce(p.role,'student')<>'admin'),
     'sources',coalesce((select jsonb_agg(jsonb_build_object('source',source,'count',n) order by n desc) from (
       select coalesce(nullif(pe.properties->'attribution'->>'utm_source',''),nullif(pe.properties->>'utm_source',''),'(direct)') source,count(distinct pe.session_id) n
       from nexora.product_events pe left join nexora.profiles p on p.id=pe.user_id
       where pe.created_at>=since_ts and coalesce(p.role,'student')<>'admin' and coalesce(pe.path,'') not like '/pages/admin%'
       group by 1 order by n desc limit 12
     )s),'[]'::jsonb)
   ),
   'activation',jsonb_build_object(
     'new_accounts',(select count(*) from nexora.profiles where created_at>=since_ts and role<>'admin'),
     'diagnostic_users',(select count(distinct pe.user_id) from nexora.product_events pe left join nexora.profiles p on p.id=pe.user_id where pe.created_at>=since_ts and pe.event_name='diagnostic_completed' and pe.user_id is not null and coalesce(p.role,'student')<>'admin'),
     'first_lesson_users',(select count(*) from (select lp.user_id,min(lp.completed_at) first_done from nexora.lesson_progress lp join nexora.profiles p on p.id=lp.user_id where lp.progress>=100 and p.role<>'admin' group by lp.user_id having min(lp.completed_at)>=since_ts)x),
     'activated_users',(select count(*) from nexora.profiles p where p.role<>'admin' and p.created_at>=since_ts and exists(select 1 from nexora.user_learning_preferences pref where pref.user_id=p.id) and exists(select 1 from nexora.lesson_progress lp where lp.user_id=p.id and lp.progress>=100)),
     'three_lesson_users',(select count(*) from (select lp.user_id from nexora.lesson_progress lp join nexora.profiles p on p.id=lp.user_id where p.role<>'admin' and lp.progress>=100 and lp.completed_at>=since_ts group by lp.user_id having count(*)>=3)x)
   ),
   'learning',jsonb_build_object(
     'completed_lessons',(select count(*) from nexora.lesson_progress lp join nexora.profiles p on p.id=lp.user_id where lp.progress>=100 and lp.completed_at>=since_ts and p.role<>'admin'),
     'assessment_attempts',(select count(*) from nexora.assessment_attempts a join nexora.profiles p on p.id=a.user_id where a.started_at>=since_ts and p.role<>'admin'),
     'project_submissions',(select count(*) from nexora.project_submissions s join nexora.profiles p on p.id=s.user_id where s.submitted_at>=since_ts and p.role<>'admin'),
     'completed_enrollments',(select count(*) from nexora.enrollments e join nexora.profiles p on p.id=e.user_id where e.status='completed' and e.completed_at>=since_ts and p.role<>'admin'),
     'certificates',(select count(*) from nexora.certificates c join nexora.profiles p on p.id=c.user_id where c.issued_at>=since_ts and p.role<>'admin')
   ),
   'retention',jsonb_build_object(
     'active_7d',(select count(distinct pe.user_id) from nexora.product_events pe join nexora.profiles p on p.id=pe.user_id where pe.created_at>=now()-interval '7 days' and p.role<>'admin'),
     'active_30d',(select count(distinct pe.user_id) from nexora.product_events pe join nexora.profiles p on p.id=pe.user_id where pe.created_at>=now()-interval '30 days' and p.role<>'admin'),
     'streak_users',(select count(*) from nexora.user_gamification g join nexora.profiles p on p.id=g.user_id where g.current_streak>0 and p.role<>'admin')
   ),
   'commerce',jsonb_build_object(
     'pro_views',(select count(*) from nexora.product_events pe left join nexora.profiles p on p.id=pe.user_id where pe.created_at>=since_ts and pe.event_name in ('pro_public_page_viewed','pro_product_viewed') and coalesce(p.role,'student')<>'admin'),
     'orders',(select count(*) from nexora.commerce_orders where created_at>=since_ts and provider<>'test'),
     'paid_orders',(select count(*) from nexora.commerce_orders where created_at>=since_ts and provider<>'test' and status='paid'),
     'gross_cents',(select coalesce(sum(amount_cents),0) from nexora.commerce_orders where created_at>=since_ts and provider<>'test' and status='paid')
   ),
   'social',jsonb_build_object(
     'reviews',(select count(*) from nexora.course_reviews where created_at>=since_ts),
     'public_reviews',(select count(*) from nexora.course_reviews where created_at>=since_ts and status='approved' and consent_public),
     'student_referrals',(select count(*) from nexora.student_referrals where created_at>=since_ts),
     'affiliate_clicks',(select count(*) from nexora.affiliate_clicks where clicked_at>=since_ts),
     'affiliate_sales',(select count(*) from nexora.commerce_orders where created_at>=since_ts and affiliate_id is not null and status='paid')
   )
 );
end $$;
revoke all on function nexora.admin_growth_summary(integer) from public,anon;
grant execute on function nexora.admin_growth_summary(integer) to authenticated,service_role;

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
    'course_opened','lesson_opened','lesson_engagement','lesson_completed',
    'inline_check_answered','lab_opened','lab_completed','quiz_started','quiz_completed',
    'boss_page_viewed','boss_submitted','boss_resubmitted',
    'certificate_page_viewed','certificate_issued',
    'support_page_viewed','support_cta_clicked','donation_started','donation_checkout_opened','donation_returned',
    'landing_page_viewed','landing_cta_clicked','pro_product_viewed','pro_checkout_started',
    'weekly_goal_changed','lesson_helpfulness_submitted','course_review_submitted',
    'learning_milestone_shared','student_referral_claimed','student_referral_shared',
    'affiliate_promo_copied','affiliate_promo_shared','contextual_pro_offer_viewed',
    'public_catalog_viewed','public_course_viewed','public_lesson_preview_viewed','public_lesson_question_answered',
    'public_boss_demo_viewed','public_certificate_demo_viewed','public_library_viewed','public_article_viewed',
    'pro_public_page_viewed','public_cta_clicked'
  ];
  v_anon_allowed constant text[]:=array[
    'signup_started','support_page_viewed','support_cta_clicked','donation_started','donation_checkout_opened','donation_returned',
    'landing_page_viewed','landing_cta_clicked',
    'public_catalog_viewed','public_course_viewed','public_lesson_preview_viewed','public_lesson_question_answered',
    'public_boss_demo_viewed','public_certificate_demo_viewed','public_library_viewed','public_article_viewed',
    'pro_public_page_viewed','public_cta_clicked'
  ];
  v_limit integer;
begin
  p_event_name:=lower(trim(coalesce(p_event_name,'')));
  p_session_id:=trim(coalesce(p_session_id,''));
  p_path:=nullif(left(trim(coalesce(p_path,'')),300),'');
  p_device_type:=lower(trim(coalesce(p_device_type,'unknown')));
  if not (p_event_name=any(v_allowed)) then raise exception 'invalid_analytics_event'; end if;
  if p_session_id !~ '^[A-Za-z0-9_-]{16,100}$' then raise exception 'invalid_analytics_session'; end if;
  if v_user is null and not (p_event_name=any(v_anon_allowed)) then raise exception 'authentication_required_for_event'; end if;
  if jsonb_typeof(coalesce(p_properties,'{}'::jsonb))<>'object' then raise exception 'invalid_analytics_properties'; end if;
  if octet_length(coalesce(p_properties,'{}'::jsonb)::text)>4096 then raise exception 'analytics_properties_too_large'; end if;
  if p_device_type not in ('mobile','tablet','desktop','unknown') then p_device_type:='unknown'; end if;
  v_limit:=case when v_user is null then 30 else 180 end;
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
end $$;
revoke all on function nexora.track_product_event(text,text,text,uuid,uuid,uuid,jsonb,text,integer,integer) from public;
grant execute on function nexora.track_product_event(text,text,text,uuid,uuid,uuid,jsonb,text,integer,integer) to anon,authenticated,service_role;
