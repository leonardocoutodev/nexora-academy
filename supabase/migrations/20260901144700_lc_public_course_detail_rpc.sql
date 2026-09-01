create or replace function nexora.public_course_detail(p_slug text)
returns jsonb
language plpgsql
security definer
set search_path = nexora, public, auth
as $$
declare
  v_course nexora.courses%rowtype;
  v_modules jsonb := '[]'::jsonb;
  v_lesson_count integer := 0;
begin
  p_slug := lower(trim(coalesce(p_slug,'')));
  if p_slug = '' or p_slug !~ '^[a-z0-9][a-z0-9-]{1,119}$' then
    return null;
  end if;

  select * into v_course
  from nexora.courses
  where slug = p_slug and status = 'published'
  limit 1;

  if not found then
    return null;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', m.id,
    'title', m.title,
    'description', m.description,
    'position', m.position,
    'lesson_count', (select count(*) from nexora.lessons l where l.module_id = m.id and l.status = 'published')
  ) order by m.position), '[]'::jsonb)
  into v_modules
  from nexora.modules m
  where m.course_id = v_course.id;

  select count(*) into v_lesson_count
  from nexora.lessons l
  join nexora.modules m on m.id = l.module_id
  where m.course_id = v_course.id and l.status = 'published';

  return jsonb_build_object(
    'id', v_course.id,
    'slug', v_course.slug,
    'title', v_course.title,
    'description', v_course.description,
    'course_type', v_course.course_type,
    'level_label', v_course.level_label,
    'category_label', v_course.category_label,
    'minimum_score', v_course.minimum_score,
    'module_count', jsonb_array_length(v_modules),
    'lesson_count', v_lesson_count,
    'modules', v_modules
  );
end
$$;

revoke all on function nexora.public_course_detail(text) from public;
grant execute on function nexora.public_course_detail(text) to anon, authenticated;
