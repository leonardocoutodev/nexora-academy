-- LC affiliate program foundation.
-- Production migration: 20260901131031_lc_affiliate_program_foundation.
-- Later migrations in this directory add terms acceptance and finalize balance reporting RPCs.

create table if not exists nexora.affiliate_program_settings (
  singleton boolean primary key default true check(singleton),
  enabled boolean not null default true,
  attribution_days integer not null default 30 check(attribution_days between 1 and 365),
  commission_hold_days integer not null default 7 check(commission_hold_days between 0 and 90),
  min_payout_cents integer not null default 5000 check(min_payout_cents >= 0),
  updated_at timestamptz not null default now()
);
insert into nexora.affiliate_program_settings(singleton,enabled,attribution_days,commission_hold_days,min_payout_cents)
values(true,true,30,7,5000) on conflict(singleton) do nothing;

create table if not exists nexora.affiliate_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  code text not null unique,
  status text not null default 'active',
  commission_bps_override integer,
  joined_at timestamptz not null default now(),
  suspended_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint affiliate_profiles_status_check check(status in ('active','suspended','closed')),
  constraint affiliate_profiles_code_check check(code ~ '^[A-Z0-9]{8,20}$'),
  constraint affiliate_profiles_commission_check check(commission_bps_override is null or commission_bps_override between 0 and 10000)
);
create index if not exists affiliate_profiles_status_idx on nexora.affiliate_profiles(status);

create table if not exists nexora.affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references nexora.affiliate_profiles(id) on delete cascade,
  session_id text not null,
  product_slug text,
  landing_path text,
  attribution jsonb not null default '{}'::jsonb,
  clicked_at timestamptz not null default now(),
  constraint affiliate_clicks_session_check check(length(session_id) between 8 and 96),
  constraint affiliate_clicks_path_check check(landing_path is null or length(landing_path)<=300)
);
create unique index if not exists affiliate_clicks_affiliate_session_uidx on nexora.affiliate_clicks(affiliate_id,session_id);
create index if not exists affiliate_clicks_affiliate_time_idx on nexora.affiliate_clicks(affiliate_id,clicked_at desc);

alter table nexora.commerce_orders
  add column if not exists affiliate_id uuid references nexora.affiliate_profiles(id) on delete set null,
  add column if not exists affiliate_code text,
  add column if not exists affiliate_commission_bps integer,
  add column if not exists attribution_session_id text,
  add column if not exists attribution_captured_at timestamptz;
do $$
begin
  if not exists(
    select 1 from pg_constraint
    where conname='commerce_orders_affiliate_commission_check'
      and conrelid='nexora.commerce_orders'::regclass
  ) then
    alter table nexora.commerce_orders
      add constraint commerce_orders_affiliate_commission_check
      check(affiliate_commission_bps is null or affiliate_commission_bps between 0 and 10000);
  end if;
end $$;
create index if not exists commerce_orders_affiliate_idx on nexora.commerce_orders(affiliate_id,status,created_at desc);

create table if not exists nexora.affiliate_payout_requests (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references nexora.affiliate_profiles(id) on delete restrict,
  amount_cents integer not null,
  gross_commission_cents integer not null,
  clawback_offset_cents integer not null default 0,
  currency text not null default 'BRL',
  status text not null default 'requested',
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  paid_at timestamptz,
  payment_reference text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint affiliate_payout_status_check check(status in ('requested','approved','paid','rejected','cancelled')),
  constraint affiliate_payout_amount_check check(amount_cents>=0 and gross_commission_cents>=0 and clawback_offset_cents>=0)
);
create index if not exists affiliate_payout_affiliate_idx on nexora.affiliate_payout_requests(affiliate_id,status,requested_at desc);

create table if not exists nexora.affiliate_commissions (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references nexora.affiliate_profiles(id) on delete restrict,
  order_id uuid not null unique references nexora.commerce_orders(id) on delete restrict,
  product_id uuid not null references nexora.commerce_products(id) on delete restrict,
  buyer_user_id uuid not null references auth.users(id) on delete restrict,
  gross_cents integer not null,
  commission_bps integer not null,
  commission_cents integer not null,
  status text not null default 'pending',
  available_at timestamptz not null,
  payout_request_id uuid references nexora.affiliate_payout_requests(id) on delete set null,
  origin_payout_request_id uuid references nexora.affiliate_payout_requests(id) on delete set null,
  paid_at timestamptz,
  reversed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint affiliate_commission_status_check check(status in ('pending','available','reserved','paid','reversed','clawback','clawback_settled')),
  constraint affiliate_commission_values_check check(gross_cents>0 and commission_cents>=0 and commission_bps between 0 and 10000)
);
create index if not exists affiliate_commissions_affiliate_idx on nexora.affiliate_commissions(affiliate_id,status,available_at);
create index if not exists affiliate_commissions_payout_idx on nexora.affiliate_commissions(payout_request_id) where payout_request_id is not null;

create schema if not exists nexora_private;
create table if not exists nexora_private.affiliate_payout_accounts (
  affiliate_id uuid primary key references nexora.affiliate_profiles(id) on delete cascade,
  payout_method text not null default 'pix',
  pix_key text not null,
  holder_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint affiliate_payout_method_check check(payout_method='pix')
);
revoke all on nexora_private.affiliate_payout_accounts from public,anon,authenticated;
grant all on nexora_private.affiliate_payout_accounts to service_role;

alter table nexora.affiliate_program_settings enable row level security;
alter table nexora.affiliate_profiles enable row level security;
alter table nexora.affiliate_clicks enable row level security;
alter table nexora.affiliate_payout_requests enable row level security;
alter table nexora.affiliate_commissions enable row level security;

drop policy if exists affiliate_settings_read on nexora.affiliate_program_settings;
create policy affiliate_settings_read on nexora.affiliate_program_settings for select to anon,authenticated using(enabled=true);
drop policy if exists affiliate_profiles_self_read on nexora.affiliate_profiles;
create policy affiliate_profiles_self_read on nexora.affiliate_profiles for select to authenticated
using((select auth.uid())=user_id or (select nexora_private.is_admin()));
drop policy if exists affiliate_clicks_self_read on nexora.affiliate_clicks;
create policy affiliate_clicks_self_read on nexora.affiliate_clicks for select to authenticated
using(exists(select 1 from nexora.affiliate_profiles ap where ap.id=affiliate_clicks.affiliate_id and ap.user_id=(select auth.uid())) or (select nexora_private.is_admin()));
drop policy if exists affiliate_payouts_self_read on nexora.affiliate_payout_requests;
create policy affiliate_payouts_self_read on nexora.affiliate_payout_requests for select to authenticated
using(exists(select 1 from nexora.affiliate_profiles ap where ap.id=affiliate_payout_requests.affiliate_id and ap.user_id=(select auth.uid())) or (select nexora_private.is_admin()));
drop policy if exists affiliate_commissions_self_read on nexora.affiliate_commissions;
create policy affiliate_commissions_self_read on nexora.affiliate_commissions for select to authenticated
using(exists(select 1 from nexora.affiliate_profiles ap where ap.id=affiliate_commissions.affiliate_id and ap.user_id=(select auth.uid())) or (select nexora_private.is_admin()));

grant select on nexora.affiliate_program_settings to anon,authenticated;
grant select on nexora.affiliate_profiles,nexora.affiliate_clicks,nexora.affiliate_payout_requests,nexora.affiliate_commissions to authenticated;
grant all on nexora.affiliate_program_settings,nexora.affiliate_profiles,nexora.affiliate_clicks,nexora.affiliate_payout_requests,nexora.affiliate_commissions to service_role;

create or replace function nexora.affiliate_set_payout_account(p_pix_key text,p_holder_name text)
returns jsonb language plpgsql security definer set search_path='nexora','nexora_private','public','auth'
as $$
declare uid uuid:=auth.uid(); aid uuid; k text:=trim(coalesce(p_pix_key,'')); h text:=trim(coalesce(p_holder_name,''));
begin
  if uid is null then raise exception 'authentication_required'; end if;
  select id into aid from nexora.affiliate_profiles where user_id=uid and status='active';
  if aid is null then raise exception 'active_affiliate_required'; end if;
  if length(k)<3 or length(k)>140 then raise exception 'invalid_pix_key'; end if;
  if length(h)<2 or length(h)>120 then raise exception 'invalid_holder_name'; end if;
  insert into nexora_private.affiliate_payout_accounts(affiliate_id,payout_method,pix_key,holder_name,updated_at)
  values(aid,'pix',k,h,now())
  on conflict(affiliate_id) do update set payout_method='pix',pix_key=excluded.pix_key,holder_name=excluded.holder_name,updated_at=now();
  return jsonb_build_object('configured',true,'method','pix','pix_masked',case when length(k)<=6 then repeat('•',length(k)) else left(k,3)||'••••'||right(k,3) end,'holder_name',h);
end $$;
revoke all on function nexora.affiliate_set_payout_account(text,text) from public,anon;
grant execute on function nexora.affiliate_set_payout_account(text,text) to authenticated,service_role;

create or replace function nexora.affiliate_request_payout()
returns jsonb language plpgsql security definer set search_path='nexora','nexora_private','public','auth'
as $$
declare uid uuid:=auth.uid(); aid uuid; cfg nexora.affiliate_program_settings%rowtype;
positive_cents bigint:=0; clawback_cents bigint:=0; net_cents bigint:=0; rid uuid;
begin
  if uid is null then raise exception 'authentication_required'; end if;
  select id into aid from nexora.affiliate_profiles where user_id=uid and status='active' for update;
  if aid is null then raise exception 'active_affiliate_required'; end if;
  select * into cfg from nexora.affiliate_program_settings where singleton=true;
  if not cfg.enabled then raise exception 'affiliate_program_disabled'; end if;
  if not exists(select 1 from nexora_private.affiliate_payout_accounts where affiliate_id=aid) then raise exception 'payout_account_required'; end if;
  if exists(select 1 from nexora.affiliate_payout_requests where affiliate_id=aid and status in ('requested','approved')) then raise exception 'payout_already_in_review'; end if;
  update nexora.affiliate_commissions set status='available',updated_at=now()
    where affiliate_id=aid and status='pending' and available_at<=now() and payout_request_id is null;
  select coalesce(sum(commission_cents),0) into positive_cents from nexora.affiliate_commissions
    where affiliate_id=aid and status='available' and payout_request_id is null;
  select coalesce(sum(commission_cents),0) into clawback_cents from nexora.affiliate_commissions
    where affiliate_id=aid and status='clawback' and payout_request_id is null;
  net_cents:=positive_cents-clawback_cents;
  if net_cents<cfg.min_payout_cents then raise exception 'minimum_payout_not_reached'; end if;
  insert into nexora.affiliate_payout_requests(affiliate_id,amount_cents,gross_commission_cents,clawback_offset_cents,currency,status)
  values(aid,net_cents,positive_cents,clawback_cents,'BRL','requested') returning id into rid;
  update nexora.affiliate_commissions set status='reserved',payout_request_id=rid,updated_at=now()
    where affiliate_id=aid and status='available' and payout_request_id is null;
  update nexora.affiliate_commissions set payout_request_id=rid,updated_at=now()
    where affiliate_id=aid and status='clawback' and payout_request_id is null;
  return jsonb_build_object('id',rid,'status','requested','amount_cents',net_cents,'gross_commission_cents',positive_cents,'clawback_offset_cents',clawback_cents);
end $$;
revoke all on function nexora.affiliate_request_payout() from public,anon;
grant execute on function nexora.affiliate_request_payout() to authenticated,service_role;

create or replace function nexora.service_record_affiliate_commission(p_order_id uuid)
returns jsonb language plpgsql security invoker set search_path='nexora','public'
as $$
declare o nexora.commerce_orders%rowtype; hold_days integer:=7; cents integer; cid uuid;
begin
  select * into o from nexora.commerce_orders where id=p_order_id for update;
  if not found then raise exception 'order_not_found'; end if;
  if o.status<>'paid' or o.affiliate_id is null or coalesce(o.affiliate_commission_bps,0)<=0 then return jsonb_build_object('created',false,'reason','not_affiliate_paid_order'); end if;
  if exists(select 1 from nexora.affiliate_profiles a where a.id=o.affiliate_id and a.user_id=o.user_id) then return jsonb_build_object('created',false,'reason','self_referral_blocked'); end if;
  select commission_hold_days into hold_days from nexora.affiliate_program_settings where singleton=true;
  cents:=round(o.amount_cents*o.affiliate_commission_bps/10000.0)::int;
  insert into nexora.affiliate_commissions(affiliate_id,order_id,product_id,buyer_user_id,gross_cents,commission_bps,commission_cents,status,available_at)
  values(o.affiliate_id,o.id,o.product_id,o.user_id,o.amount_cents,o.affiliate_commission_bps,cents,'pending',coalesce(o.paid_at,now())+make_interval(days=>coalesce(hold_days,7)))
  on conflict(order_id) do nothing returning id into cid;
  return jsonb_build_object('created',cid is not null,'commission_id',cid,'commission_cents',cents);
end $$;
revoke all on function nexora.service_record_affiliate_commission(uuid) from public,anon,authenticated;
grant execute on function nexora.service_record_affiliate_commission(uuid) to service_role;

create or replace function nexora.service_reverse_affiliate_commission(p_order_id uuid)
returns jsonb language plpgsql security invoker set search_path='nexora','public'
as $$
declare c nexora.affiliate_commissions%rowtype; rid uuid; new_amount integer;
begin
  select * into c from nexora.affiliate_commissions where order_id=p_order_id for update;
  if not found then return jsonb_build_object('reversed',false,'reason','commission_not_found'); end if;
  if c.status='paid' then
    update nexora.affiliate_commissions set status='clawback',origin_payout_request_id=payout_request_id,payout_request_id=null,reversed_at=now(),updated_at=now() where id=c.id;
    return jsonb_build_object('reversed',true,'mode','clawback','commission_cents',c.commission_cents);
  elsif c.status='reserved' then
    rid:=c.payout_request_id;
    update nexora.affiliate_commissions set status='reversed',payout_request_id=null,reversed_at=now(),updated_at=now() where id=c.id;
    update nexora.affiliate_payout_requests set gross_commission_cents=greatest(0,gross_commission_cents-c.commission_cents),amount_cents=greatest(0,amount_cents-c.commission_cents),updated_at=now()
      where id=rid returning amount_cents into new_amount;
    if coalesce(new_amount,0)=0 then
      update nexora.affiliate_payout_requests set status='rejected',reviewed_at=now(),notes=concat_ws(E'\n',notes,'Cancelado automaticamente após reversão de comissão.'),updated_at=now()
        where id=rid and status in ('requested','approved');
      update nexora.affiliate_commissions set status='available',payout_request_id=null,updated_at=now() where payout_request_id=rid and status='reserved';
      update nexora.affiliate_commissions set payout_request_id=null,updated_at=now() where payout_request_id=rid and status='clawback';
    end if;
    return jsonb_build_object('reversed',true,'mode','reserved_reversal','commission_cents',c.commission_cents);
  elsif c.status in ('pending','available') then
    update nexora.affiliate_commissions set status='reversed',payout_request_id=null,reversed_at=now(),updated_at=now() where id=c.id;
    return jsonb_build_object('reversed',true,'mode','unpaid_reversal','commission_cents',c.commission_cents);
  end if;
  return jsonb_build_object('reversed',false,'reason','already_reconciled','status',c.status);
end $$;
revoke all on function nexora.service_reverse_affiliate_commission(uuid) from public,anon,authenticated;
grant execute on function nexora.service_reverse_affiliate_commission(uuid) to service_role;

create or replace function nexora.admin_affiliate_payout_roster(p_status text default null)
returns table(payout_id uuid,affiliate_id uuid,full_name text,email text,code text,status text,amount_cents integer,gross_commission_cents integer,clawback_offset_cents integer,currency text,requested_at timestamptz,reviewed_at timestamptz,paid_at timestamptz,payment_reference text,notes text,payout_method text,pix_key text,holder_name text)
language plpgsql security definer set search_path='nexora','nexora_private','public','auth'
as $$
begin
  if auth.uid() is null or not nexora_private.is_admin() then raise exception 'admin_required'; end if;
  if p_status is not null and p_status not in ('requested','approved','paid','rejected','cancelled') then raise exception 'invalid_payout_status'; end if;
  return query
  select r.id,a.id,coalesce(p.full_name,'')::text,coalesce(u.email,'')::text,a.code,r.status,r.amount_cents,r.gross_commission_cents,r.clawback_offset_cents,r.currency,
         r.requested_at,r.reviewed_at,r.paid_at,r.payment_reference,r.notes,coalesce(pa.payout_method,'pix')::text,coalesce(pa.pix_key,'')::text,coalesce(pa.holder_name,'')::text
  from nexora.affiliate_payout_requests r join nexora.affiliate_profiles a on a.id=r.affiliate_id
  left join nexora.profiles p on p.id=a.user_id left join auth.users u on u.id=a.user_id
  left join nexora_private.affiliate_payout_accounts pa on pa.affiliate_id=a.id
  where p_status is null or r.status=p_status order by r.requested_at desc limit 200;
end $$;
revoke all on function nexora.admin_affiliate_payout_roster(text) from public,anon;
grant execute on function nexora.admin_affiliate_payout_roster(text) to authenticated,service_role;

create or replace function nexora.admin_update_affiliate(p_affiliate_id uuid,p_status text default null,p_commission_bps_override integer default null,p_clear_override boolean default false)
returns jsonb language plpgsql security definer set search_path='nexora','public','auth'
as $$
declare old nexora.affiliate_profiles%rowtype; newr nexora.affiliate_profiles%rowtype;
begin
  if auth.uid() is null or not nexora_private.is_admin() then raise exception 'admin_required'; end if;
  select * into old from nexora.affiliate_profiles where id=p_affiliate_id for update;
  if not found then raise exception 'affiliate_not_found'; end if;
  if p_status is not null and p_status not in ('active','suspended','closed') then raise exception 'invalid_affiliate_status'; end if;
  if p_commission_bps_override is not null and (p_commission_bps_override<0 or p_commission_bps_override>10000) then raise exception 'invalid_commission'; end if;
  update nexora.affiliate_profiles set status=coalesce(p_status,status),
    commission_bps_override=case when p_clear_override then null when p_commission_bps_override is not null then p_commission_bps_override else commission_bps_override end,
    suspended_at=case when coalesce(p_status,status)='suspended' then coalesce(suspended_at,now()) else null end,updated_at=now()
  where id=p_affiliate_id returning * into newr;
  insert into nexora.admin_audit_log(actor_id,action,target_type,target_id,details)
  values(auth.uid(),'affiliate_update','affiliate',p_affiliate_id,jsonb_build_object('old_status',old.status,'new_status',newr.status,'old_commission_bps_override',old.commission_bps_override,'new_commission_bps_override',newr.commission_bps_override));
  return jsonb_build_object('id',newr.id,'status',newr.status,'commission_bps_override',newr.commission_bps_override,'updated_at',newr.updated_at);
end $$;
revoke all on function nexora.admin_update_affiliate(uuid,text,integer,boolean) from public,anon;
grant execute on function nexora.admin_update_affiliate(uuid,text,integer,boolean) to authenticated,service_role;

create or replace function nexora.admin_review_affiliate_payout(p_request_id uuid,p_action text,p_payment_reference text default null,p_notes text default null)
returns jsonb language plpgsql security definer set search_path='nexora','public','auth'
as $$
declare r nexora.affiliate_payout_requests%rowtype; act text:=lower(trim(coalesce(p_action,''))); ref text:=trim(coalesce(p_payment_reference,''));
begin
  if auth.uid() is null or not nexora_private.is_admin() then raise exception 'admin_required'; end if;
  if act not in ('approve','reject','paid') then raise exception 'invalid_payout_action'; end if;
  select * into r from nexora.affiliate_payout_requests where id=p_request_id for update;
  if not found then raise exception 'payout_not_found'; end if;
  if r.status not in ('requested','approved') then raise exception 'payout_not_open'; end if;
  if act='approve' then
    update nexora.affiliate_payout_requests set status='approved',reviewed_at=now(),reviewed_by=auth.uid(),notes=coalesce(p_notes,notes),updated_at=now() where id=r.id;
  elsif act='reject' then
    update nexora.affiliate_commissions set status='available',payout_request_id=null,updated_at=now() where payout_request_id=r.id and status='reserved';
    update nexora.affiliate_commissions set payout_request_id=null,updated_at=now() where payout_request_id=r.id and status='clawback';
    update nexora.affiliate_payout_requests set status='rejected',reviewed_at=now(),reviewed_by=auth.uid(),notes=coalesce(p_notes,notes),updated_at=now() where id=r.id;
  else
    if length(ref)<3 then raise exception 'payment_reference_required'; end if;
    if r.amount_cents<=0 then raise exception 'invalid_payout_amount'; end if;
    update nexora.affiliate_commissions set status='paid',paid_at=now(),updated_at=now() where payout_request_id=r.id and status='reserved';
    update nexora.affiliate_commissions set status='clawback_settled',updated_at=now() where payout_request_id=r.id and status='clawback';
    update nexora.affiliate_payout_requests set status='paid',reviewed_at=coalesce(reviewed_at,now()),reviewed_by=auth.uid(),paid_at=now(),payment_reference=ref,notes=coalesce(p_notes,notes),updated_at=now() where id=r.id;
  end if;
  insert into nexora.admin_audit_log(actor_id,action,target_type,target_id,details)
  values(auth.uid(),'affiliate_payout_'||act,'affiliate_payout',r.id,jsonb_build_object('affiliate_id',r.affiliate_id,'amount_cents',r.amount_cents,'payment_reference',nullif(ref,'')));
  return (select jsonb_build_object('id',x.id,'status',x.status,'amount_cents',x.amount_cents,'paid_at',x.paid_at,'payment_reference',x.payment_reference) from nexora.affiliate_payout_requests x where x.id=r.id);
end $$;
revoke all on function nexora.admin_review_affiliate_payout(uuid,text,text,text) from public,anon;
grant execute on function nexora.admin_review_affiliate_payout(uuid,text,text,text) to authenticated,service_role;
