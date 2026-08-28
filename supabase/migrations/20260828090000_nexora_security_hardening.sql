-- Harden exposed Nexora columns without changing existing rows or academic flows.
begin;

revoke update on table nexora.profiles from authenticated;
grant update (full_name, avatar_path) on table nexora.profiles to authenticated;

revoke select on table nexora.questions from authenticated;
grant select (id, assessment_id, prompt, question_type, options, difficulty, position, created_at)
  on table nexora.questions to authenticated;

drop policy if exists gamification_self_select on nexora.user_gamification;
create policy gamification_self_select on nexora.user_gamification
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists xp_events_self_select on nexora.xp_events;
create policy xp_events_self_select on nexora.xp_events
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists badges_read_authenticated on nexora.badges;
create policy badges_read_authenticated on nexora.badges
  for select to authenticated using (true);
drop policy if exists user_badges_self_select on nexora.user_badges;
create policy user_badges_self_select on nexora.user_badges
  for select to authenticated using ((select auth.uid()) = user_id);

revoke execute on function nexora.get_active_promotions(text) from public, anon;
grant execute on function nexora.get_active_promotions(text) to authenticated;

commit;
