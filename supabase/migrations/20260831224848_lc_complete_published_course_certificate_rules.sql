insert into nexora.course_completion_rules (
  course_id,
  minimum_lesson_progress,
  minimum_assessment_score,
  require_all_module_assessments,
  require_final_assessment,
  require_final_project,
  minimum_project_score,
  certificate_enabled,
  updated_at
)
select
  c.id,
  100,
  70,
  true,
  false,
  false,
  70,
  true,
  now()
from nexora.courses c
where c.status='published'
  and not exists (
    select 1
    from nexora.course_completion_rules r
    where r.course_id=c.id
  )
  and exists (
    select 1
    from nexora.assessments a
    where a.course_id=c.id
      and a.status='published'
      and a.module_id is not null
  );
