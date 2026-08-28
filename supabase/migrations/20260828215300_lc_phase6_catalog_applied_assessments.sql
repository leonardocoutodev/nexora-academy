-- LC Phase 6 — Applied assessment pass
-- Replaces the last two definition-only questions of each module assessment
-- with application/mastery evidence questions and adds three integrative
-- questions to final assessments without changing assessment length.

with q_rank as (
  select q.id question_id,q.assessment_id,q.position,
         q.correct_answer->>'option_id' correct_id,
         q.difficulty,a.module_id,a.course_id,
         row_number() over(partition by a.id order by q.position desc) q_rn
  from nexora.questions q
  join nexora.assessments a on a.id=q.assessment_id
  join nexora.courses c on c.id=a.course_id
  where a.status='published' and a.module_id is not null
    and c.status='published' and c.title<>'Lógica de Programação Básica'
),
lesson_rank as (
  select l.id lesson_id,l.module_id,l.title,l.content,
         row_number() over(partition by l.module_id order by l.position desc) lesson_rn
  from nexora.lessons l where l.status='published'
),
module_targets as (
  select q.question_id,q.correct_id,q.difficulty,q.q_rn,
         l.title lesson_title,l.content,
         coalesce((select e->>'body' from jsonb_array_elements(l.content) e where e->>'type'='example' limit 1),
                  (select e->>'body' from jsonb_array_elements(l.content) e where e->>'type'='concept' limit 1),l.title) example_body,
         coalesce((select e->>'body' from jsonb_array_elements(l.content) e where e->>'type'='mistake' limit 1),
                  'Aplicar o conceito sem verificar o resultado.') mistake_body,
         coalesce((select e->'items'->>0 from jsonb_array_elements(l.content) e where e->>'type'='mastery' limit 1),
                  'Consigo demonstrar a competência com evidência reproduzível.') mastery_item
  from q_rank q
  join lesson_rank l on l.module_id=q.module_id and l.lesson_rn=q.q_rn
  where q.q_rn<=2
),
module_labels as (
  select t.*,
    case when t.q_rn=1
      then t.example_body||' A aplicação é comparada ao comportamento esperado antes de ser aceita.'
      else t.mastery_item||' A evidência inclui também um estado, entrada ou caso alternativo.' end correct_label,
    case when t.q_rn=1
      then t.mistake_body||' Mesmo assim, considerar uma única execução suficiente.'
      else 'Memorizar a definição e ignorar o resultado observado.' end wrong1,
    case when t.q_rn=1
      then 'Repetir apenas a demonstração da aula sem testar entrada, estado ou condição diferente.'
      else 'Usar somente o caso mais fácil e tratar ausência de erro como prova de domínio.' end wrong2,
    case when t.q_rn=1
      then 'Executar primeiro e decidir depois qual resultado deveria ser considerado correto.'
      else 'Trocar o critério de sucesso depois de observar a saída.' end wrong3
  from module_targets t
),
module_options as (
  select l.*,
    (
      select jsonb_agg(jsonb_build_object(
        'id',x.id,
        'label',case when x.id=l.correct_id then l.correct_label
          else case array_position(array_remove(array['a','b','c','d']::text[],l.correct_id),x.id)
            when 1 then l.wrong1 when 2 then l.wrong2 else l.wrong3 end end
      ) order by x.ord)
      from unnest(array['a','b','c','d']::text[]) with ordinality x(id,ord)
    ) new_options
  from module_labels l
)
update nexora.questions q
set prompt=case when m.q_rn=1
      then 'Uma entrega sobre "'||m.lesson_title||'" chegou para revisão. Qual alternativa representa a aplicação mais defensável?'
      else 'Ao validar domínio de "'||m.lesson_title||'", qual plano produz a melhor evidência de aprendizagem?' end,
    options=m.new_options,
    feedback_correct='Correto. A alternativa combina aplicação, evidência e validação coerentes com "'||m.lesson_title||'".',
    feedback_incorrect='Ainda não. Compare a alternativa com o erro provável e com os critérios de domínio da aula "'||m.lesson_title||'".',
    difficulty=greatest(coalesce(q.difficulty,1),case when m.q_rn=1 then 2 else 3 end)
from module_options m
where q.id=m.question_id;

with module_rank as (
  select m.id module_id,m.course_id,m.position,
         row_number() over(partition by m.course_id order by m.position) mrn,
         count(*) over(partition by m.course_id) mcount
  from nexora.modules m
  join nexora.courses c on c.id=m.course_id
  where c.status='published' and c.title<>'Lógica de Programação Básica'
),
selected_modules as (
  select *,row_number() over(partition by course_id order by position) pick_rn
  from module_rank
  where mrn=1 or mrn=ceil(mcount/2.0)::int or mrn=mcount
),
selected_lessons as (
  select sm.course_id,sm.pick_rn,l.title,l.content
  from selected_modules sm
  join lateral (
    select l.* from nexora.lessons l
    where l.module_id=sm.module_id and l.status='published'
    order by l.position desc limit 1
  ) l on true
),
final_q as (
  select q.id question_id,a.course_id,
         q.correct_answer->>'option_id' correct_id,q.difficulty,
         row_number() over(partition by a.id order by q.position desc) q_rn
  from nexora.questions q
  join nexora.assessments a on a.id=q.assessment_id
  join nexora.courses c on c.id=a.course_id
  where a.status='published' and a.module_id is null
    and c.status='published' and c.title<>'Lógica de Programação Básica'
),
final_targets as (
  select fq.question_id,fq.correct_id,fq.difficulty,fq.q_rn,
         sl.title lesson_title,sl.content,
         coalesce((select e->>'body' from jsonb_array_elements(sl.content) e where e->>'type'='example' limit 1),
                  (select e->>'body' from jsonb_array_elements(sl.content) e where e->>'type'='concept' limit 1),sl.title) example_body,
         coalesce((select e->>'body' from jsonb_array_elements(sl.content) e where e->>'type'='mistake' limit 1),
                  'Aplicar o conceito sem validação.') mistake_body
  from final_q fq
  join selected_lessons sl on sl.course_id=fq.course_id and sl.pick_rn=fq.q_rn
  where fq.q_rn<=3
),
final_labels as (
  select f.*,
    f.example_body||' Em seguida, o resultado é verificado em um cenário diferente antes de ser integrado à solução.' correct_label,
    f.mistake_body||' O fluxo segue mesmo sem evidência adicional.' wrong1,
    'Tratar o conceito isoladamente e ignorar como ele afeta os demais módulos da solução.' wrong2,
    'Aceitar o primeiro resultado plausível e ajustar o critério de sucesso somente depois da execução.' wrong3
  from final_targets f
),
final_options as (
  select l.*,
    (
      select jsonb_agg(jsonb_build_object(
        'id',x.id,
        'label',case when x.id=l.correct_id then l.correct_label
          else case array_position(array_remove(array['a','b','c','d']::text[],l.correct_id),x.id)
            when 1 then l.wrong1 when 2 then l.wrong2 else l.wrong3 end end
      ) order by x.ord)
      from unnest(array['a','b','c','d']::text[]) with ordinality x(id,ord)
    ) new_options
  from final_labels l
)
update nexora.questions q
set prompt='Na avaliação integradora, você precisa conectar "'||f.lesson_title||'" ao restante da solução. Qual decisão produz a evidência mais confiável?',
    options=f.new_options,
    feedback_correct='Correto. A resposta conecta a competência a uma evidência reproduzível e a uma validação antes da integração.',
    feedback_incorrect='Ainda não. Uma avaliação final exige integração e evidência; não basta repetir uma definição ou aceitar uma única execução.',
    difficulty=greatest(coalesce(q.difficulty,1),3)
from final_options f
where q.id=f.question_id;

update nexora.assessments a
set randomize_questions=true
from nexora.courses c
where a.course_id=c.id and a.status='published'
  and c.status='published' and c.title<>'Lógica de Programação Básica';
