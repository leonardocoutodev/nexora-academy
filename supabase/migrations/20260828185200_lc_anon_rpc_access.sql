-- LC Phase 4 — allow only explicitly granted anonymous RPCs to be reached through the exposed schema.
begin;
grant usage on schema nexora to anon;
revoke all on nexora.product_events from anon;
revoke all on nexora.certificates from anon;
revoke all on nexora.profiles from anon;
revoke all on nexora.courses from anon;
commit;
