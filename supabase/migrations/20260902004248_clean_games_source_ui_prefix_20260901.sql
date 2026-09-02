-- LC audit 360 — remove source-player UI residue from published game lessons.
-- Scope is intentionally narrow: preserve full lesson rows before removing only
-- the exact imported prefix "clique para começar Seja Bem-Vindo a aula de Começo".

create table if not exists nexora_private.lesson_source_ui_prefix_backup_20260901_run13 as
select l.*
from nexora.lessons l
join nexora.modules m on m.id=l.module_id
join nexora.courses c on c.id=m.course_id
where l.status='published'
  and c.status='published'
  and lower(l.content::text) like '%clique para começar%'
with no data;

insert into nexora_private.lesson_source_ui_prefix_backup_20260901_run13
select l.*
from nexora.lessons l
join nexora.modules m on m.id=l.module_id
join nexora.courses c on c.id=m.course_id
where l.status='published'
  and c.status='published'
  and lower(l.content::text) like '%clique para começar%'
  and not exists (
    select 1
    from nexora_private.lesson_source_ui_prefix_backup_20260901_run13 b
    where b.id=l.id
  );

update nexora.lessons l
set content = (
  select jsonb_agg(
    case
      when lower(coalesce(elem->>'body','')) like 'clique para começar seja bem-vindo a aula de começo%'
      then jsonb_set(
        elem,
        '{body}',
        to_jsonb(regexp_replace(
          elem->>'body',
          '^clique para começar Seja Bem-Vindo a aula de Começo[[:space:]]*',
          '',
          'i'
        )),
        false
      )
      else elem
    end
    order by ord
  )
  from jsonb_array_elements(l.content) with ordinality as x(elem,ord)
)
where l.id in (
  select b.id
  from nexora_private.lesson_source_ui_prefix_backup_20260901_run13 b
);
