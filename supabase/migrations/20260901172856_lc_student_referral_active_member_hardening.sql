
create or replace function nexora.claim_student_referral(p_code text)
returns jsonb
language plpgsql
security definer
set search_path='nexora','nexora_private','auth','public'
as $$
declare
  uid uuid:=auth.uid();
  referrer uuid;
  inserted_id uuid;
  badge_id uuid;
  reward integer:=100;
  normalized text;
begin
  if uid is null then raise exception 'authentication_required'; end if;
  if not nexora_private.is_member() then
    return jsonb_build_object('claimed',false,'reason','member_inactive');
  end if;

  normalized:=upper(trim(coalesce(p_code,'')));
  if normalized !~ '^LCF[A-Z0-9]{9}$' then
    return jsonb_build_object('claimed',false,'reason','invalid_code');
  end if;

  select user_id into referrer
  from nexora.student_referral_codes
  where code=normalized;

  if referrer is null then
    return jsonb_build_object('claimed',false,'reason','code_not_found');
  end if;
  if referrer=uid then
    return jsonb_build_object('claimed',false,'reason','self_referral_blocked');
  end if;
  if not exists(
    select 1 from nexora.profiles p
    where p.id=referrer and p.status='active'
  ) then
    return jsonb_build_object('claimed',false,'reason','referrer_inactive');
  end if;
  if exists(select 1 from nexora.student_referrals where referred_user_id=uid) then
    return jsonb_build_object('claimed',false,'reason','already_attributed');
  end if;

  insert into nexora.student_referrals(referrer_user_id,referred_user_id,code)
  values(referrer,uid,normalized)
  on conflict(referred_user_id) do nothing
  returning id into inserted_id;

  if inserted_id is null then
    return jsonb_build_object('claimed',false,'reason','already_attributed');
  end if;

  if (select count(*) from nexora.student_referrals where referrer_user_id=referrer)=1 then
    select id,xp_reward into badge_id,reward
    from nexora.badges
    where code='community_inviter';

    if badge_id is not null then
      insert into nexora.user_badges(user_id,badge_id)
      values(referrer,badge_id)
      on conflict do nothing;

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

revoke all on function nexora.claim_student_referral(text) from public,anon;
grant execute on function nexora.claim_student_referral(text) to authenticated,service_role;
