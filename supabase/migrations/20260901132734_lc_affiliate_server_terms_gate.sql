-- Enforce affiliate terms acceptance at the server boundary.
-- Production migration: 20260901132734_lc_affiliate_server_terms_gate.

drop function if exists nexora.affiliate_join();

create function nexora.affiliate_join(p_terms_version text,p_accept_terms boolean)
returns jsonb
language plpgsql
security definer
set search_path='nexora','public','auth'
as $$
declare
  uid uuid:=auth.uid();
  v nexora.affiliate_profiles%rowtype;
  candidate text;
  tries integer:=0;
  v_terms constant text:='2026-09-01';
begin
  if uid is null then raise exception 'authentication_required'; end if;
  if not nexora_private.is_member() then raise exception 'member_required'; end if;
  if p_accept_terms is distinct from true or trim(coalesce(p_terms_version,''))<>v_terms then
    raise exception 'affiliate_terms_acceptance_required';
  end if;
  if not coalesce((select enabled from nexora.affiliate_program_settings where singleton=true),false) then
    raise exception 'affiliate_program_disabled';
  end if;

  select * into v from nexora.affiliate_profiles where user_id=uid;
  if found then
    if v.terms_accepted_at is null or v.terms_version is distinct from v_terms then
      update nexora.affiliate_profiles
      set terms_version=v_terms,terms_accepted_at=now(),updated_at=now()
      where id=v.id returning * into v;
    end if;
    return jsonb_build_object('id',v.id,'code',v.code,'status',v.status,'joined_at',v.joined_at,'terms_version',v.terms_version,'terms_accepted_at',v.terms_accepted_at);
  end if;

  loop
    tries:=tries+1;
    candidate:='LC'||upper(substr(md5(gen_random_uuid()::text),1,10));
    exit when not exists(select 1 from nexora.affiliate_profiles where code=candidate);
    if tries>10 then raise exception 'affiliate_code_generation_failed'; end if;
  end loop;

  insert into nexora.affiliate_profiles(user_id,code,status,terms_version,terms_accepted_at)
  values(uid,candidate,'active',v_terms,now())
  returning * into v;

  return jsonb_build_object('id',v.id,'code',v.code,'status',v.status,'joined_at',v.joined_at,'terms_version',v.terms_version,'terms_accepted_at',v.terms_accepted_at);
end $$;

revoke all on function nexora.affiliate_join(text,boolean) from public,anon;
grant execute on function nexora.affiliate_join(text,boolean) to authenticated,service_role;
