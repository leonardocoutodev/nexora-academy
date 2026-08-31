create or replace function nexora_private.handle_new_lc_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into nexora.profiles (id, full_name, role, status)
  values (
    new.id,
    coalesce(
      nullif(pg_catalog.btrim(coalesce(new.raw_user_meta_data ->> 'full_name','')), ''),
      nullif(pg_catalog.split_part(coalesce(new.email,''),'@',1), ''),
      'Aluno'
    ),
    'student',
    'active'
  )
  on conflict (id) do update
  set
    full_name = case
      when nullif(pg_catalog.btrim(coalesce(nexora.profiles.full_name,'')), '') is null
        then excluded.full_name
      else nexora.profiles.full_name
    end,
    updated_at = pg_catalog.now();

  return new;
end;
$$;

revoke all on function nexora_private.handle_new_lc_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_lc_profile on auth.users;
create trigger on_auth_user_created_lc_profile
after insert on auth.users
for each row
execute function nexora_private.handle_new_lc_user();

insert into nexora.profiles (id, full_name, role, status)
select
  u.id,
  coalesce(
    nullif(pg_catalog.btrim(coalesce(u.raw_user_meta_data ->> 'full_name','')), ''),
    nullif(pg_catalog.split_part(coalesce(u.email,''),'@',1), ''),
    'Aluno'
  ),
  'student',
  'active'
from auth.users u
left join nexora.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;
