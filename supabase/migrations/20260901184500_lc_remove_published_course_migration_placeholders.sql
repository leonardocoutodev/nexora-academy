create table if not exists nexora_private.course_metadata_migration_placeholder_backup_20260901 as
select c.*, now() as backed_up_at
from nexora.courses c
where false;

insert into nexora_private.course_metadata_migration_placeholder_backup_20260901
select c.*, now() as backed_up_at
from nexora.courses c
where c.status = 'published'
  and (
    (c.description = 'Formação importada para revisão editorial na LC. A estrutura de módulos foi preservada como referência da Ouro/Live Connect; as aulas serão revisadas e adaptadas ao padrão pedagógico LC antes da publicação.'
     and c.recommendation_note = 'Importação Ouro em revisão')
    or
    (c.description = 'Curso curto importado da referência Ouro para revisão editorial LC. Conteúdo ainda em draft.'
     and c.recommendation_note = 'Curso livre Ouro em revisão')
  )
  and not exists (
    select 1 from nexora_private.course_metadata_migration_placeholder_backup_20260901 b where b.id = c.id
  );

update nexora.courses c
set description = case
      when c.course_type = 'short_course' then
        'Curso gratuito da LC em ' || c.title || ', organizado em aulas progressivas para desenvolver competências práticas na área de ' || coalesce(c.category_label, 'formação profissional') || '.'
      else
        'Formação gratuita da LC em ' || c.title || ', organizada em módulos progressivos com aulas e atividades para desenvolver competências práticas na área de ' || coalesce(c.category_label, 'formação profissional') || '.'
    end,
    recommendation_note = null,
    updated_at = now()
where c.status = 'published'
  and (
    (c.description = 'Formação importada para revisão editorial na LC. A estrutura de módulos foi preservada como referência da Ouro/Live Connect; as aulas serão revisadas e adaptadas ao padrão pedagógico LC antes da publicação.'
     and c.recommendation_note = 'Importação Ouro em revisão')
    or
    (c.description = 'Curso curto importado da referência Ouro para revisão editorial LC. Conteúdo ainda em draft.'
     and c.recommendation_note = 'Curso livre Ouro em revisão')
  );