-- Follow-up found by the post-migration audit.
update nexora.lessons l
set objective = format(
  'Ao concluir a aula %s do módulo “%s”, no curso “%s”, você deverá explicar “%s”, aplicar esse conhecimento em uma atividade verificável e validar o resultado com um caso comum e um caso-limite.',
  l.position, m.title, c.title, l.title
), updated_at=now()
from nexora.modules m
join nexora.courses c on c.id=m.course_id
where m.id=l.module_id;

create index if not exists learning_resources_course_id_idx on nexora.learning_resources(course_id);
create index if not exists learning_resources_module_id_idx on nexora.learning_resources(module_id);
create index if not exists learning_resources_lesson_id_idx on nexora.learning_resources(lesson_id);
create index if not exists learning_resources_external_idx on nexora.learning_resources(is_external) where is_external;

