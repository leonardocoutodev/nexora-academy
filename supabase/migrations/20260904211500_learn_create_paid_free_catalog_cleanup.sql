-- Learn & Create: separa catálogo gratuito de formações profissionais pagas.
-- O fluxo acadêmico externo permanece white-label e restrito à camada técnica.

create table if not exists nexora_private.course_duplicate_cleanup_20260904 (
  course_id uuid primary key,
  snapshot jsonb not null,
  captured_at timestamptz not null default now()
);

with imported_formations as (
  select c.id,
         lower(regexp_replace(translate(c.title,
           'ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇç',
           'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCc'
         ),'[^A-Za-z0-9]+','','g')) norm
  from nexora.academic_course_links acl
  join nexora.courses c on c.id=acl.course_id
  where acl.is_active and coalesce(acl.metadata->>'catalog_kind','')='formation'
), duplicates as (
  select c.id
  from nexora.courses c
  join imported_formations f
    on f.id<>c.id
   and f.norm=lower(regexp_replace(translate(c.title,
      'ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇç',
      'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCc'
   ),'[^A-Za-z0-9]+','','g'))
  where c.access_tier='free' and c.course_type='short_course'
)
insert into nexora_private.course_duplicate_cleanup_20260904(course_id,snapshot)
select c.id,jsonb_build_object(
  'course',to_jsonb(c),
  'modules',coalesce((select jsonb_agg(to_jsonb(m) order by m.position) from nexora.modules m where m.course_id=c.id),'[]'::jsonb),
  'lessons',coalesce((select jsonb_agg(to_jsonb(l) order by m.position,l.position) from nexora.lessons l join nexora.modules m on m.id=l.module_id where m.course_id=c.id),'[]'::jsonb),
  'assessments',coalesce((select jsonb_agg(to_jsonb(a)) from nexora.assessments a where a.course_id=c.id),'[]'::jsonb),
  'enrollments',coalesce((select jsonb_agg(to_jsonb(e)) from nexora.enrollments e where e.course_id=c.id),'[]'::jsonb)
)
from nexora.courses c join duplicates d on d.id=c.id
on conflict(course_id) do nothing;

with imported_formations as (
  select c.id,
         lower(regexp_replace(translate(c.title,
           'ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇç',
           'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCc'
         ),'[^A-Za-z0-9]+','','g')) norm
  from nexora.academic_course_links acl
  join nexora.courses c on c.id=acl.course_id
  where acl.is_active and coalesce(acl.metadata->>'catalog_kind','')='formation'
), duplicates as (
  select c.id
  from nexora.courses c
  join imported_formations f
    on f.id<>c.id
   and f.norm=lower(regexp_replace(translate(c.title,
      'ÁÀÂÃÄáàâãäÉÈÊËéèêëÍìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇç',
      'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCc'
   ),'[^A-Za-z0-9]+','','g'))
  where c.access_tier='free' and c.course_type='short_course'
)
delete from nexora.courses c using duplicates d where c.id=d.id;

update nexora.courses c
set access_tier='pro',certificate_type='professional_pro',updated_at=now()
from nexora.academic_course_links acl
where acl.course_id=c.id and acl.is_active
  and coalesce(acl.metadata->>'catalog_kind','')='formation';

update nexora.academic_course_links
set metadata=metadata||jsonb_build_object('offer_kind','paid_formation','commercial_visibility','public'),
    updated_at=now()
where is_active and coalesce(metadata->>'catalog_kind','')='formation';

create or replace function nexora.public_catalog_courses()
returns table(
  id uuid,slug text,title text,description text,course_type text,level_label text,
  category_label text,access_tier text,certificate_type text,module_count bigint,
  lesson_count bigint,estimated_minutes bigint
)
language sql stable security definer
set search_path=nexora,public
as $$
 select c.id,c.slug,c.title,c.description,c.course_type,c.level_label,c.category_label,
        c.access_tier,c.certificate_type,
        (select count(*) from nexora.modules m where m.course_id=c.id),
        (select count(*) from nexora.lessons l join nexora.modules m on m.id=l.module_id where m.course_id=c.id and l.status='published'),
        coalesce((select sum(l.estimated_minutes) from nexora.lessons l join nexora.modules m on m.id=l.module_id where m.course_id=c.id and l.status='published'),0)
 from nexora.courses c
 where c.status='published'
 order by case when c.access_tier='free' then 0 else 1 end,c.position,c.title;
$$;

create or replace function nexora.catalog_courses()
returns table(
  id uuid,slug text,title text,description text,minimum_score numeric,course_position integer,
  course_type text,level_label text,category_label text,is_recommended_start boolean,
  recommendation_note text,access_tier text,certificate_type text,module_count bigint,
  lesson_count bigint,estimated_minutes bigint,xp_total bigint,completed_lessons bigint,
  progress_pct integer,is_enrolled boolean
)
language sql stable security definer
set search_path=nexora,public,auth
as $$
 select c.id,c.slug,c.title,c.description,c.minimum_score,c.position,c.course_type,c.level_label,
        c.category_label,c.is_recommended_start,c.recommendation_note,c.access_tier,c.certificate_type,
        (select count(*) from nexora.modules m where m.course_id=c.id),
        (select count(*) from nexora.lessons l join nexora.modules m on m.id=l.module_id where m.course_id=c.id and l.status='published'),
        coalesce((select sum(l.estimated_minutes) from nexora.lessons l join nexora.modules m on m.id=l.module_id where m.course_id=c.id and l.status='published'),0),
        coalesce((select sum(l.xp_reward) from nexora.lessons l join nexora.modules m on m.id=l.module_id where m.course_id=c.id and l.status='published'),0),
        (select count(*) from nexora.lesson_progress lp join nexora.lessons l on l.id=lp.lesson_id join nexora.modules m on m.id=l.module_id where m.course_id=c.id and lp.user_id=auth.uid() and lp.progress>=100),
        case when (select count(*) from nexora.lessons l join nexora.modules m on m.id=l.module_id where m.course_id=c.id and l.status='published')=0 then 0
        else round(100.0*(select count(*) from nexora.lesson_progress lp join nexora.lessons l on l.id=lp.lesson_id join nexora.modules m on m.id=l.module_id where m.course_id=c.id and lp.user_id=auth.uid() and lp.progress>=100)/(select count(*) from nexora.lessons l join nexora.modules m on m.id=l.module_id where m.course_id=c.id and l.status='published'))::integer end,
        exists(select 1 from nexora.enrollments e where e.user_id=auth.uid() and e.course_id=c.id and e.status in('active','completed'))
 from nexora.courses c
 where auth.uid() is not null and nexora_private.is_member() and c.status='published'
 order by case when c.access_tier='free' then 0 else 1 end,c.position,c.title;
$$;

create or replace function nexora.public_course_detail(p_slug text)
returns jsonb language plpgsql security definer
set search_path=nexora,public,auth
as $$
declare v_course nexora.courses%rowtype;v_modules jsonb:='[]'::jsonb;v_lesson_count integer:=0;
begin
 p_slug:=lower(trim(coalesce(p_slug,'')));
 if p_slug='' or p_slug!~'^[a-z0-9][a-z0-9-]{1,119}$' then return null;end if;
 select * into v_course from nexora.courses where slug=p_slug and status='published' and slug<>'lc-pro-programador-full-stack' limit 1;
 if not found then return null;end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',m.id,'title',m.title,'description',m.description,'position',m.position,'lesson_count',(select count(*) from nexora.lessons l where l.module_id=m.id and l.status='published')) order by m.position),'[]'::jsonb)
 into v_modules from nexora.modules m where m.course_id=v_course.id;
 select count(*) into v_lesson_count from nexora.lessons l join nexora.modules m on m.id=l.module_id where m.course_id=v_course.id and l.status='published';
 return jsonb_build_object('id',v_course.id,'slug',v_course.slug,'title',v_course.title,'description',v_course.description,'course_type',v_course.course_type,'level_label',v_course.level_label,'category_label',v_course.category_label,'minimum_score',v_course.minimum_score,'access_tier',v_course.access_tier,'certificate_type',v_course.certificate_type,'module_count',jsonb_array_length(v_modules),'lesson_count',v_lesson_count,'modules',v_modules);
end $$;

revoke all on function nexora.public_catalog_courses() from public;
grant execute on function nexora.public_catalog_courses() to anon,authenticated;
grant execute on function nexora.public_course_detail(text) to anon,authenticated;
grant execute on function nexora.catalog_courses() to authenticated;
