begin;
update nexora.questions q
set correct_answer=jsonb_build_object('id',q.correct_answer->>'option_id')
where q.assessment_id in (
  select a.id from nexora.assessments a
  join nexora.modules m on m.id=a.module_id
  join nexora.courses c on c.id=a.course_id
  where c.slug='programador-master' and m.position=1
)
and q.correct_answer ? 'option_id';
commit;