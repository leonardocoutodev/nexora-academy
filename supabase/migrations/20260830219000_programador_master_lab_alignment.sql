begin;
-- M4: DOM/eventos/formulários usam Web Lab; localStorage vira checkpoint conceitual.
update nexora.lessons l set lab_type='html',lab_config='{}'::jsonb,updated_at=now()
where l.module_id=(select m.id from nexora.modules m join nexora.courses c on c.id=m.course_id where c.slug='programador-master' and m.position=4)
and l.position in (8,9,10);

update nexora.lessons l
set lab_type='checkpoint',
    lab_config=jsonb_build_object('checkpoint',jsonb_build_object(
      'question',(select e->>'question' from jsonb_array_elements(l.content) e where e->>'type'='guided' limit 1),
      'options',(select e->'options' from jsonb_array_elements(l.content) e where e->>'type'='guided' limit 1),
      'answer',coalesce((select (e->>'answer')::int from jsonb_array_elements(l.content) e where e->>'type'='guided' limit 1),0),
      'feedback','Correto. Você aplicou o conceito da aula.'
    )),updated_at=now()
where l.module_id=(select m.id from nexora.modules m join nexora.courses c on c.id=m.course_id where c.slug='programador-master' and m.position=4)
and l.position=11;

-- M5: PDO e CRUD completo não usam o SQL simulator introdutório como se validasse PHP.
update nexora.lessons l
set lab_type='checkpoint',
    lab_config=jsonb_build_object('checkpoint',jsonb_build_object(
      'question',(select e->>'question' from jsonb_array_elements(l.content) e where e->>'type'='guided' limit 1),
      'options',(select e->'options' from jsonb_array_elements(l.content) e where e->>'type'='guided' limit 1),
      'answer',coalesce((select (e->>'answer')::int from jsonb_array_elements(l.content) e where e->>'type'='guided' limit 1),0),
      'feedback','Correto. Você aplicou o conceito da aula.'
    )),updated_at=now()
where l.module_id=(select m.id from nexora.modules m join nexora.courses c on c.id=m.course_id where c.slug='programador-master' and m.position=5)
and l.position in (11,12);

-- M7: Python Lab fica apenas onde o simulador realmente cobre a sintaxe.
update nexora.lessons l
set lab_type='checkpoint',
    lab_config=jsonb_build_object('checkpoint',jsonb_build_object(
      'question',(select e->>'question' from jsonb_array_elements(l.content) e where e->>'type'='guided' limit 1),
      'options',(select e->'options' from jsonb_array_elements(l.content) e where e->>'type'='guided' limit 1),
      'answer',coalesce((select (e->>'answer')::int from jsonb_array_elements(l.content) e where e->>'type'='guided' limit 1),0),
      'feedback','Correto. Você aplicou o conceito da aula.'
    )),updated_at=now()
where l.module_id=(select m.id from nexora.modules m join nexora.courses c on c.id=m.course_id where c.slug='programador-master' and m.position=7)
and l.position between 7 and 12;
commit;