-- Affiliate balance/reporting finalization.
-- Production migration: 20260901132014_lc_affiliate_balance_reporting_fix.

create or replace function nexora.affiliate_dashboard()
returns jsonb
language plpgsql
security definer
set search_path='nexora','nexora_private','public','auth'
as $$
declare uid uuid:=auth.uid(); a nexora.affiliate_profiles%rowtype; cfg nexora.affiliate_program_settings%rowtype; acct nexora_private.affiliate_payout_accounts%rowtype; v jsonb;
begin
  if uid is null then raise exception 'authentication_required'; end if;
  select * into cfg from nexora.affiliate_program_settings where singleton=true;
  select * into a from nexora.affiliate_profiles where user_id=uid;
  if not found then
    return jsonb_build_object('joined',false,'program',jsonb_build_object('enabled',cfg.enabled,'attribution_days',cfg.attribution_days,'commission_hold_days',cfg.commission_hold_days,'min_payout_cents',cfg.min_payout_cents));
  end if;
  select * into acct from nexora_private.affiliate_payout_accounts where affiliate_id=a.id;
  select jsonb_build_object(
    'joined',true,
    'profile',jsonb_build_object('id',a.id,'code',a.code,'status',a.status,'joined_at',a.joined_at,'commission_bps_override',a.commission_bps_override,'terms_version',a.terms_version,'terms_accepted_at',a.terms_accepted_at),
    'program',jsonb_build_object('enabled',cfg.enabled,'attribution_days',cfg.attribution_days,'commission_hold_days',cfg.commission_hold_days,'min_payout_cents',cfg.min_payout_cents),
    'payout_account',case when acct.affiliate_id is null then jsonb_build_object('configured',false) else jsonb_build_object('configured',true,'method','pix','pix_masked',case when length(acct.pix_key)<=6 then repeat('•',length(acct.pix_key)) else left(acct.pix_key,3)||'••••'||right(acct.pix_key,3) end,'holder_name',acct.holder_name,'updated_at',acct.updated_at) end,
    'products',coalesce((select jsonb_agg(jsonb_build_object('slug',p.slug,'title',p.title,'price_cents',p.current_price_cents,'currency',p.currency,'commission_bps',coalesce(a.commission_bps_override,p.affiliate_commission_bps),'commission_cents',round(p.current_price_cents*coalesce(a.commission_bps_override,p.affiliate_commission_bps)/10000.0)::int) order by p.created_at) from nexora.commerce_products p where p.sales_status='active' and p.affiliate_commission_bps>0),'[]'::jsonb),
    'metrics',jsonb_build_object(
      'clicks_total',(select count(*) from nexora.affiliate_clicks c where c.affiliate_id=a.id),
      'clicks_30d',(select count(*) from nexora.affiliate_clicks c where c.affiliate_id=a.id and c.clicked_at>=now()-interval '30 days'),
      'paid_sales',(select count(*) from nexora.commerce_orders o where o.affiliate_id=a.id and o.status='paid'),
      'pending_cents',(select coalesce(sum(c.commission_cents),0) from nexora.affiliate_commissions c where c.affiliate_id=a.id and c.status='pending' and c.available_at>now()),
      'available_cents',((select coalesce(sum(c.commission_cents),0) from nexora.affiliate_commissions c where c.affiliate_id=a.id and c.payout_request_id is null and (c.status='available' or (c.status='pending' and c.available_at<=now())))-(select coalesce(sum(c.commission_cents),0) from nexora.affiliate_commissions c where c.affiliate_id=a.id and c.status='clawback' and c.payout_request_id is null)),
      'reserved_cents',(select coalesce(sum(c.commission_cents),0) from nexora.affiliate_commissions c where c.affiliate_id=a.id and c.status='reserved'),
      'paid_cents',(select coalesce(sum(r.amount_cents),0) from nexora.affiliate_payout_requests r where r.affiliate_id=a.id and r.status='paid'),
      'clawback_cents',(select coalesce(sum(c.commission_cents),0) from nexora.affiliate_commissions c where c.affiliate_id=a.id and c.status='clawback'),
      'conversion_rate',case when (select count(*) from nexora.affiliate_clicks c where c.affiliate_id=a.id)=0 then 0 else round(100.0*(select count(*) from nexora.commerce_orders o where o.affiliate_id=a.id and o.status='paid')/(select count(*) from nexora.affiliate_clicks c where c.affiliate_id=a.id),2) end
    ),
    'commissions',coalesce((select jsonb_agg(jsonb_build_object('id',c.id,'product_title',p.title,'gross_cents',c.gross_cents,'commission_bps',c.commission_bps,'commission_cents',c.commission_cents,'status',case when c.status='pending' and c.available_at<=now() then 'available' else c.status end,'available_at',c.available_at,'created_at',c.created_at,'paid_at',c.paid_at,'reversed_at',c.reversed_at) order by c.created_at desc) from (select * from nexora.affiliate_commissions where affiliate_id=a.id order by created_at desc limit 50)c join nexora.commerce_products p on p.id=c.product_id),'[]'::jsonb),
    'payouts',coalesce((select jsonb_agg(jsonb_build_object('id',r.id,'amount_cents',r.amount_cents,'gross_commission_cents',r.gross_commission_cents,'clawback_offset_cents',r.clawback_offset_cents,'currency',r.currency,'status',r.status,'requested_at',r.requested_at,'reviewed_at',r.reviewed_at,'paid_at',r.paid_at,'payment_reference',r.payment_reference) order by r.requested_at desc) from (select * from nexora.affiliate_payout_requests where affiliate_id=a.id order by requested_at desc limit 30)r),'[]'::jsonb)
  ) into v;
  return v;
end $$;
revoke all on function nexora.affiliate_dashboard() from public,anon;
grant execute on function nexora.affiliate_dashboard() to authenticated,service_role;

create or replace function nexora.admin_affiliate_summary()
returns jsonb language plpgsql security definer set search_path='nexora','nexora_private','public','auth'
as $$
begin
  if auth.uid() is null or not nexora_private.is_admin() then raise exception 'admin_required'; end if;
  return jsonb_build_object(
    'affiliates',(select count(*) from nexora.affiliate_profiles),
    'active_affiliates',(select count(*) from nexora.affiliate_profiles where status='active'),
    'clicks_30d',(select count(*) from nexora.affiliate_clicks where clicked_at>=now()-interval '30 days'),
    'paid_sales',(select count(*) from nexora.commerce_orders where affiliate_id is not null and status='paid'),
    'commission_pending_cents',(select coalesce(sum(commission_cents),0) from nexora.affiliate_commissions where status='pending' and available_at>now()),
    'commission_available_cents',((select coalesce(sum(commission_cents),0) from nexora.affiliate_commissions where payout_request_id is null and (status='available' or (status='pending' and available_at<=now())))-(select coalesce(sum(commission_cents),0) from nexora.affiliate_commissions where status='clawback' and payout_request_id is null)),
    'payouts_requested_cents',(select coalesce(sum(amount_cents),0) from nexora.affiliate_payout_requests where status in ('requested','approved')),
    'payouts_paid_cents',(select coalesce(sum(amount_cents),0) from nexora.affiliate_payout_requests where status='paid'),
    'clawback_cents',(select coalesce(sum(commission_cents),0) from nexora.affiliate_commissions where status='clawback')
  );
end $$;
revoke all on function nexora.admin_affiliate_summary() from public,anon;
grant execute on function nexora.admin_affiliate_summary() to authenticated,service_role;

create or replace function nexora.admin_affiliate_roster()
returns table(affiliate_id uuid,user_id uuid,full_name text,email text,code text,status text,commission_bps_override integer,joined_at timestamptz,clicks bigint,paid_sales bigint,pending_cents bigint,available_cents bigint,paid_cents bigint,clawback_cents bigint)
language plpgsql security definer set search_path='nexora','public','auth'
as $$
begin
  if auth.uid() is null or not nexora_private.is_admin() then raise exception 'admin_required'; end if;
  return query
  select a.id,a.user_id,coalesce(p.full_name,'')::text,coalesce(u.email,'')::text,a.code,a.status,a.commission_bps_override,a.joined_at,
    (select count(*) from nexora.affiliate_clicks c where c.affiliate_id=a.id),
    (select count(*) from nexora.commerce_orders o where o.affiliate_id=a.id and o.status='paid'),
    (select coalesce(sum(c.commission_cents),0) from nexora.affiliate_commissions c where c.affiliate_id=a.id and c.status='pending' and c.available_at>now()),
    ((select coalesce(sum(c.commission_cents),0) from nexora.affiliate_commissions c where c.affiliate_id=a.id and c.payout_request_id is null and (c.status='available' or (c.status='pending' and c.available_at<=now())))-(select coalesce(sum(c.commission_cents),0) from nexora.affiliate_commissions c where c.affiliate_id=a.id and c.status='clawback' and c.payout_request_id is null)),
    (select coalesce(sum(r.amount_cents),0) from nexora.affiliate_payout_requests r where r.affiliate_id=a.id and r.status='paid'),
    (select coalesce(sum(c.commission_cents),0) from nexora.affiliate_commissions c where c.affiliate_id=a.id and c.status='clawback')
  from nexora.affiliate_profiles a left join nexora.profiles p on p.id=a.user_id left join auth.users u on u.id=a.user_id
  order by a.joined_at desc;
end $$;
revoke all on function nexora.admin_affiliate_roster() from public,anon;
grant execute on function nexora.admin_affiliate_roster() to authenticated,service_role;
