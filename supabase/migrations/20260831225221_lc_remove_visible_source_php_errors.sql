create table if not exists nexora_private.lessons_source_error_cleanup_20260831 (
  lesson_id uuid primary key,
  content jsonb not null,
  backed_up_at timestamptz not null default now()
);

insert into nexora_private.lessons_source_error_cleanup_20260831 (lesson_id, content)
select distinct l.id,l.content
from nexora.lessons l
cross join lateral jsonb_array_elements(l.content) e(value)
where coalesce(e.value->>'body','') ~* 'Warning\\s*:\\s*Trying to access array offset|/var/www/crm/4passos/exercicios\\.php'
on conflict (lesson_id) do nothing;

update nexora.lessons l
set content = cleaned.content,
    updated_at = now()
from (
  select l2.id,
         jsonb_agg(e.value order by e.ordinality) filter (
           where coalesce(e.value->>'body','') !~* 'Warning\\s*:\\s*Trying to access array offset|/var/www/crm/4passos/exercicios\\.php'
         ) as content
  from nexora.lessons l2
  cross join lateral jsonb_array_elements(l2.content) with ordinality e(value,ordinality)
  where exists (
    select 1
    from jsonb_array_elements(l2.content) x(value)
    where coalesce(x.value->>'body','') ~* 'Warning\\s*:\\s*Trying to access array offset|/var/www/crm/4passos/exercicios\\.php'
  )
  group by l2.id
) cleaned
where l.id=cleaned.id
  and cleaned.content is not null
  and jsonb_array_length(cleaned.content)>0;

revoke all on nexora_private.lessons_source_error_cleanup_20260831 from public,anon,authenticated;
grant all on nexora_private.lessons_source_error_cleanup_20260831 to service_role;
