create or replace function nexora.consume_public_rate_limit(
  p_action text,
  p_rate_key text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language sql
security definer
set search_path=nexora_private,pg_catalog
as $$
  select nexora_private.consume_public_rate_limit(p_action,p_rate_key,p_limit,p_window_seconds)
$$;

revoke all on function nexora.consume_public_rate_limit(text,text,integer,integer) from public,anon,authenticated;
grant execute on function nexora.consume_public_rate_limit(text,text,integer,integer) to service_role;
