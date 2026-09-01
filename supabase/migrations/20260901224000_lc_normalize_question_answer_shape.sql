-- LC audit: normalize legacy assessment answer payloads without changing editorial content.
-- The backend already accepts both {"id": ...} and {"option_id": ...}; this migration
-- removes the remaining migration residue so every question uses the canonical shape.

create table if not exists nexora_private.question_answer_shape_backup_20260901_run11 as
select q.*, now() as backed_up_at
from nexora.questions q
where q.correct_answer ? 'id'
  and not (q.correct_answer ? 'option_id')
  and exists (
    select 1
    from jsonb_array_elements(q.options) o
    where o->>'id' = q.correct_answer->>'id'
  );

update nexora.questions q
set correct_answer = (q.correct_answer - 'id') || jsonb_build_object('option_id', q.correct_answer->>'id')
where q.correct_answer ? 'id'
  and not (q.correct_answer ? 'option_id')
  and exists (
    select 1
    from jsonb_array_elements(q.options) o
    where o->>'id' = q.correct_answer->>'id'
  );
