
create or replace function nexora.admin_donation_roster(
  p_status text default null,
  p_limit integer default 100
)
returns table(
  donation_id uuid,
  donor_name text,
  payer_email text,
  amount numeric,
  status text,
  provider text,
  payment_method text,
  approved_at timestamptz,
  created_at timestamptz,
  public_listing boolean,
  message text
)
language plpgsql
security definer
set search_path=nexora,public,auth
as $$
begin
  if auth.uid() is null or not nexora_private.is_admin() then raise exception 'admin_required'; end if;
  if p_status is not null and p_status not in ('pending','approved','rejected','cancelled','refunded','in_process','unknown') then
    raise exception 'invalid_donation_status';
  end if;
  return query
  select d.id,d.donor_name,d.payer_email,d.amount,d.status,d.provider,d.payment_method,d.approved_at,d.created_at,s.public_listing,d.message
  from nexora.donations d
  join nexora.supporters s on s.id=d.supporter_id
  where p_status is null or d.status=p_status
  order by d.created_at desc
  limit greatest(1,least(coalesce(p_limit,100),250));
end
$$;

create or replace function nexora.admin_register_manual_donation(
  p_name text,
  p_email text,
  p_amount numeric,
  p_message text default null,
  p_public_listing boolean default false,
  p_approved_at timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path=nexora,public,auth
as $$
declare
  v_name text:=trim(coalesce(p_name,''));
  v_email text:=lower(trim(coalesce(p_email,'')));
  v_supporter nexora.supporters%rowtype;
  v_donation nexora.donations%rowtype;
  v_total numeric;
  v_count integer;
  v_last timestamptz;
begin
  if auth.uid() is null or not nexora_private.is_admin() then raise exception 'admin_required'; end if;
  if length(v_name)<2 then raise exception 'invalid_donor_name'; end if;
  if v_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' then raise exception 'invalid_donor_email'; end if;
  if p_amount is null or p_amount<1 or p_amount>100000 then raise exception 'invalid_donation_amount'; end if;

  select * into v_supporter from nexora.supporters where lower(email)=v_email order by created_at asc limit 1 for update;
  if not found then
    insert into nexora.supporters(name,email,message,public_listing)
    values(v_name,v_email,nullif(left(trim(coalesce(p_message,'')),500),''),coalesce(p_public_listing,false))
    returning * into v_supporter;
  else
    update nexora.supporters
    set name=v_name,
        message=coalesce(nullif(left(trim(coalesce(p_message,'')),500),''),message),
        public_listing=coalesce(p_public_listing,false),
        updated_at=now()
    where id=v_supporter.id
    returning * into v_supporter;
  end if;

  insert into nexora.donations(
    supporter_id,user_id,amount,currency,status,provider,payer_email,donor_name,message,payment_method,approved_at
  )
  values(
    v_supporter.id,null,round(p_amount::numeric,2),'BRL','approved','pix_direct',v_email,v_name,
    nullif(left(trim(coalesce(p_message,'')),500),''),'pix',coalesce(p_approved_at,now())
  )
  returning * into v_donation;

  select coalesce(sum(amount),0),count(*)::int,max(approved_at)
  into v_total,v_count,v_last
  from nexora.donations
  where supporter_id=v_supporter.id and status='approved';

  update nexora.supporters
  set total_donated=v_total,donation_count=v_count,last_donation_at=v_last,updated_at=now()
  where id=v_supporter.id;

  insert into nexora.admin_audit_log(actor_id,action,target_type,target_id,details)
  values(auth.uid(),'donation_manual_register','donation',v_donation.id,jsonb_build_object(
    'amount',v_donation.amount,'provider','pix_direct','public_listing',coalesce(p_public_listing,false)
  ));

  return jsonb_build_object(
    'donation_id',v_donation.id,'supporter_id',v_supporter.id,'amount',v_donation.amount,
    'status',v_donation.status,'approved_at',v_donation.approved_at
  );
end
$$;

revoke all on function nexora.admin_donation_roster(text,integer) from public,anon;
revoke all on function nexora.admin_register_manual_donation(text,text,numeric,text,boolean,timestamptz) from public,anon;
grant execute on function nexora.admin_donation_roster(text,integer) to authenticated;
grant execute on function nexora.admin_register_manual_donation(text,text,numeric,text,boolean,timestamptz) to authenticated;
