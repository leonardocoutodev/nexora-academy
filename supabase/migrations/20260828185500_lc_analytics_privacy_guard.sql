-- LC Phase 4 — defense-in-depth privacy guard for analytics properties.
begin;

create or replace function nexora_private.guard_product_event_privacy()
returns trigger
language plpgsql
security definer
set search_path to 'nexora','public'
as $function$
begin
  if coalesce(new.properties,'{}'::jsonb) ?| array[
    'email','name','full_name','phone','telephone','whatsapp','cpf','rg',
    'password','senha','token','access_token','refresh_token','authorization',
    'address','endereco'
  ] then
    raise exception 'analytics_sensitive_property_rejected';
  end if;
  return new;
end
$function$;

drop trigger if exists trg_product_events_privacy on nexora.product_events;
create trigger trg_product_events_privacy
before insert or update of properties on nexora.product_events
for each row execute function nexora_private.guard_product_event_privacy();

commit;
