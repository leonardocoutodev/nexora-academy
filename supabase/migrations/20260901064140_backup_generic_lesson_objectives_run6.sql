create table if not exists nexora_private.lesson_objective_backup_20260901_run6 as
select l.id,l.objective,l.updated_at
from nexora.lessons l
join nexora.modules m on m.id=l.module_id
join nexora.courses c on c.id=m.course_id
where c.status='published' and l.status='published'
  and (lower(coalesce(l.objective,'')) like '%conteúdo integral migrado%'
       or lower(coalesce(l.objective,'')) like '%revisão editorial na lc%');

revoke all on nexora_private.lesson_objective_backup_20260901_run6 from public,anon,authenticated;
grant all on nexora_private.lesson_objective_backup_20260901_run6 to service_role;
