-- LC Phase 6 — Assessment depth pass
-- Converts all remaining definition-only questions outside the Logic baseline
-- into application, verification and integration questions. Idempotent because
-- it targets only the legacy "Qual definição..." prompt pattern.

with module_questions as (
  select q.id question_id,q.assessment_id,q.position,q.correct_answer->>'option_id' correct_id,
         a.module_id,row_number() over(partition by a.id order by q.position) qrn
  from nexora.questions q
  join nexora.assessments a on a.id=q.assessment_id
  join nexora.courses c on c.id=a.course_id
  where a.status='published' and a.module_id is not null
    and c.status='published' and c.title<>'Lógica de Programação Básica'
    and lower(q.prompt) like 'qual definição%'
),
lesson_pool as (
  select l.module_id,l.title,l.content,
         row_number() over(partition by l.module_id order by l.position) lrn,
         count(*) over(partition by l.module_id) lcount
  from nexora.lessons l where l.status='published'
),
targets as (
  select mq.*,lp.title lesson_title,lp.content,mod(mq.position,3) pattern,
         left(coalesce((select e->>'body' from jsonb_array_elements(lp.content) e where e->>'type'='concept' limit 1),lp.title),220) concept_body,
         left(coalesce((select e->>'body' from jsonb_array_elements(lp.content) e where e->>'type'='example' limit 1),
                       (select e->>'body' from jsonb_array_elements(lp.content) e where e->>'type'='concept' limit 1),lp.title),220) example_body,
         left(coalesce((select e->>'body' from jsonb_array_elements(lp.content) e where e->>'type'='mistake' limit 1),
                       'Aplicar a ideia sem conferir o resultado.'),180) mistake_body,
         left(coalesce((select e->'items'->>0 from jsonb_array_elements(lp.content) e where e->>'type'='mastery' limit 1),
                       'Demonstrar o comportamento com uma evidência reproduzível.'),200) mastery_item
  from module_questions mq
  join lesson_pool lp on lp.module_id=mq.module_id and lp.lrn=((mq.qrn-1)%lp.lcount)+1
),
labels as (
  select t.*,
    case t.pattern
      when 0 then t.example_body||' Em seguida, comparar o resultado com o comportamento esperado e registrar a evidência.'
      when 1 then t.mastery_item||' Isso é verificado com uma entrada comum e outro caso que altere estado, limite ou condição.'
      else t.concept_body||' A regra é transformada em um critério observável antes da execução e depois conferida no resultado.'
    end correct_label,
    t.mistake_body||' Mesmo assim, considerar a tarefa concluída sem investigar a divergência.' wrong1,
    'Repetir a demonstração original de "'||t.lesson_title||'" sem variar entrada, estado ou condição e usar isso como única evidência.' wrong2,
    'Observar a saída primeiro e só depois alterar o critério de sucesso para que o resultado pareça correto.' wrong3
  from targets t
),
opts as (
  select l.*,
    (select jsonb_agg(jsonb_build_object(
       'id',x.id,
       'label',case when x.id=l.correct_id then l.correct_label
         else case array_position(array_remove(array['a','b','c','d']::text[],l.correct_id),x.id)
           when 1 then l.wrong1 when 2 then l.wrong2 else l.wrong3 end end
     ) order by x.ord)
     from unnest(array['a','b','c','d']::text[]) with ordinality x(id,ord)) new_options
  from labels l
)
update nexora.questions q
set prompt=case o.pattern
      when 0 then 'Durante uma tarefa sobre "'||o.lesson_title||'", qual decisão mostra aplicação real do conceito em vez de simples reconhecimento?'
      when 1 then 'Qual plano de verificação demonstra melhor domínio de "'||o.lesson_title||'"?'
      else 'Uma implementação de "'||o.lesson_title||'" precisa ser revisada. Qual abordagem produz a evidência mais confiável?'
    end,
    options=o.new_options,
    feedback_correct='Correto. A alternativa liga "'||o.lesson_title||'" a comportamento observável e validação.',
    feedback_incorrect='Ainda não. A resposta precisa demonstrar aplicação, critério de sucesso definido antes da execução e evidência verificável.',
    difficulty=greatest(coalesce(q.difficulty,1),case when o.pattern=1 then 3 else 2 end)
from opts o
where q.id=o.question_id;

with final_questions as (
  select q.id question_id,q.position,q.correct_answer->>'option_id' correct_id,a.course_id,
         row_number() over(partition by a.id order by q.position) qrn
  from nexora.questions q
  join nexora.assessments a on a.id=q.assessment_id
  join nexora.courses c on c.id=a.course_id
  where a.status='published' and a.module_id is null
    and c.status='published' and c.title<>'Lógica de Programação Básica'
    and lower(q.prompt) like 'qual definição%'
),
module_pool as (
  select m.id module_id,m.course_id,m.title module_title,
         row_number() over(partition by m.course_id order by m.position) mrn,
         count(*) over(partition by m.course_id) mcount
  from nexora.modules m
),
targets as (
  select fq.*,mp.module_id,mp.module_title,l.title lesson_title,l.content,mod(fq.position,3) pattern,
         left(coalesce((select e->>'body' from jsonb_array_elements(l.content) e where e->>'type'='concept' limit 1),l.title),220) concept_body,
         left(coalesce((select e->>'body' from jsonb_array_elements(l.content) e where e->>'type'='example' limit 1),
                       (select e->>'body' from jsonb_array_elements(l.content) e where e->>'type'='concept' limit 1),l.title),220) example_body,
         left(coalesce((select e->>'body' from jsonb_array_elements(l.content) e where e->>'type'='mistake' limit 1),
                       'Aplicar a ideia sem validar integração ou resultado.'),180) mistake_body
  from final_questions fq
  join module_pool mp on mp.course_id=fq.course_id and mp.mrn=((fq.qrn-1)%mp.mcount)+1
  join lateral (
    select ll.* from nexora.lessons ll
    where ll.module_id=mp.module_id and ll.status='published'
    order by case mod(fq.qrn,3) when 0 then ll.position else -ll.position end desc
    limit 1
  ) l on true
),
labels as (
  select t.*,
    case t.pattern
      when 0 then t.example_body||' Antes de integrar, a equipe reproduz o resultado e testa uma condição diferente da demonstração.'
      when 1 then t.concept_body||' A competência é conectada ao fluxo maior por um critério observável e um teste que pode falhar.'
      else t.example_body||' A evidência é registrada e comparada com o requisito do módulo "'||t.module_title||'" antes da aprovação.'
    end correct_label,
    t.mistake_body||' A solução é integrada mesmo sem uma segunda verificação.' wrong1,
    'Validar somente "'||t.lesson_title||'" de forma isolada e ignorar efeitos, entradas ou dependências dos demais módulos.' wrong2,
    'Aceitar uma saída plausível e redefinir o requisito depois da execução para coincidir com o resultado.' wrong3
  from targets t
),
opts as (
  select l.*,
    (select jsonb_agg(jsonb_build_object(
       'id',x.id,
       'label',case when x.id=l.correct_id then l.correct_label
         else case array_position(array_remove(array['a','b','c','d']::text[],l.correct_id),x.id)
           when 1 then l.wrong1 when 2 then l.wrong2 else l.wrong3 end end
     ) order by x.ord)
     from unnest(array['a','b','c','d']::text[]) with ordinality x(id,ord)) new_options
  from labels l
)
update nexora.questions q
set prompt=case o.pattern
      when 0 then 'No projeto integrador, como "'||o.lesson_title||'" deve ser validado antes de entrar na solução final?'
      when 1 then 'Ao conectar o módulo "'||o.module_title||'" ao restante do curso, qual decisão demonstra domínio integrado?'
      else 'Uma equipe revisa a contribuição de "'||o.lesson_title||'" para a solução final. Qual evidência é mais defensável?'
    end,
    options=o.new_options,
    feedback_correct='Correto. A alternativa conecta a competência do módulo a integração, reprodução e teste verificável.',
    feedback_incorrect='Ainda não. Na avaliação final, a competência precisa funcionar no conjunto e ser sustentada por evidência, não só por reconhecimento conceitual.',
    difficulty=greatest(coalesce(q.difficulty,1),3)
from opts o
where q.id=o.question_id;
