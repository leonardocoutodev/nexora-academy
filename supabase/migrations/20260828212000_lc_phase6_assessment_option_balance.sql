with target_questions as (
  select q.id,q.position,q.options,q.correct_answer->>'option_id' as correct_id,
         ((coalesce(m.position,6)+q.position-2)%4)+1 as desired_position
  from nexora.questions q
  join nexora.assessments a on a.id=q.assessment_id
  left join nexora.modules m on m.id=a.module_id
  join nexora.courses c on c.id=a.course_id
  where c.title='Lógica de Programação Básica'
), expanded as (
  select tq.id,tq.desired_position,tq.correct_id,e.value,e.ordinality,
         count(*) filter(where e.value->>'id'<>tq.correct_id)
           over(partition by tq.id order by e.ordinality rows between unbounded preceding and current row) as noncorrect_index
  from target_questions tq
  cross join lateral jsonb_array_elements(tq.options) with ordinality e(value,ordinality)
), ranked as (
  select id,value,
         case
           when value->>'id'=correct_id then desired_position
           when noncorrect_index>=desired_position then noncorrect_index+1
           else noncorrect_index
         end as visual_position
  from expanded
), rebuilt as (
  select id,jsonb_agg(value order by visual_position) as options
  from ranked
  group by id
)
update nexora.questions q
set options=r.options
from rebuilt r
where q.id=r.id;
