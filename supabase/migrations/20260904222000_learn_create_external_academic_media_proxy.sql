-- Learn & Create: streaming white-label de mídias acadêmicas externas.
-- A origem fica restrita ao backend; o aluno recebe apenas rotas /api/lc/media/*.

create or replace function nexora_private.lesson_media_files(p_lesson_id uuid)
returns table(kind text, media_index integer, filename text, mime text)
language sql
stable
security definer
set search_path = nexora, nexora_private, public, auth
as $$
with source_row as (
  select p.source_assets
  from nexora.lessons l
  join nexora.modules m on m.id=l.module_id
  join nexora.ouro_lesson_bindings b on b.lc_lesson_id=l.id
  join nexora.ouro_source_lesson_payloads p
    on p.source_course_id=b.source_course_id
   and p.lesson_position=b.lesson_position
  where l.id=p_lesson_id
    and (
      nexora_private.is_admin()
      or (
        nexora_private.is_member()
        and exists (
          select 1 from nexora.enrollments e
          where e.course_id=m.course_id
            and e.user_id=auth.uid()
            and e.status in ('active','completed')
        )
      )
    )
  limit 1
),
raw as (
  select 'video'::text kind,0 grp,0::bigint ord,source_assets->>'intro_video' filename
  from source_row where coalesce(source_assets->>'intro_video','')<>''
  union all select 'video',1,v.ord,v.value from source_row,
    lateral jsonb_array_elements_text(coalesce(source_assets->'videos','[]'::jsonb)) with ordinality v(value,ord)
  union all select 'video',2,v.ord,v.value from source_row,
    lateral jsonb_array_elements_text(coalesce(source_assets->'step_assets'->'videos','[]'::jsonb)) with ordinality v(value,ord)
  union all select 'audio',1,a.ord,a.value from source_row,
    lateral jsonb_array_elements_text(coalesce(source_assets->'audio','[]'::jsonb)) with ordinality a(value,ord)
  union all select 'audio',2,a.ord,a.value from source_row,
    lateral jsonb_array_elements_text(coalesce(source_assets->'step_assets'->'audio','[]'::jsonb)) with ordinality a(value,ord)
  union all select 'image',0,0::bigint,source_assets->>'cover' from source_row
    where coalesce(source_assets->>'cover','')<>''
  union all select 'image',1,i.ord,i.value from source_row,
    lateral jsonb_array_elements_text(coalesce(source_assets->'images','[]'::jsonb)) with ordinality i(value,ord)
  union all select 'image',2,i.ord,i.value from source_row,
    lateral jsonb_array_elements_text(coalesce(source_assets->'step_assets'->'images','[]'::jsonb)) with ordinality i(value,ord)
  union all
  select case
      when lower(f.value) ~ '\\.(mp4)$' then 'video'
      when lower(f.value) ~ '\\.(mp3)$' then 'audio'
      when lower(f.value) ~ '\\.(png|jpe?g|webp|gif)$' then 'image'
      when lower(f.value) ~ '\\.(pdf)$' then 'document'
      else 'other'
    end,3,f.ord,f.value
  from source_row,
    lateral jsonb_array_elements_text(coalesce(source_assets->'files','[]'::jsonb)) with ordinality f(value,ord)
),
clean as (
  select distinct on(kind,filename) kind,grp,ord,filename
  from raw
  where kind in ('video','audio','image','document')
    and filename is not null
    and length(filename) between 1 and 255
    and filename ~ '^[A-Za-z0-9._-]+
),
numbered as (
  select kind,(row_number() over(partition by kind order by grp,ord,filename)-1)::integer media_index,filename
  from clean
)
select kind,media_index,filename,
  case
    when lower(filename) like '%.mp4' then 'video/mp4'
    when lower(filename) like '%.mp3' then 'audio/mpeg'
    when lower(filename) like '%.png' then 'image/png'
    when lower(filename) like '%.jpg' or lower(filename) like '%.jpeg' then 'image/jpeg'
    when lower(filename) like '%.webp' then 'image/webp'
    when lower(filename) like '%.gif' then 'image/gif'
    when lower(filename) like '%.pdf' then 'application/pdf'
    else 'application/octet-stream'
  end mime
from numbered
order by kind,media_index;
$$;

revoke all on function nexora_private.lesson_media_files(uuid) from public,anon,authenticated;

create or replace function nexora.lesson_media_manifest(p_lesson_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = nexora, nexora_private, public, auth
as $$
with media as (select * from nexora_private.lesson_media_files(p_lesson_id)),
packed as (
  select
    coalesce(jsonb_agg(jsonb_build_object('index',media_index,'mime',mime,'label','Vídeo '||(media_index+1)) order by media_index) filter(where kind='video'),'[]'::jsonb) videos,
    coalesce(jsonb_agg(jsonb_build_object('index',media_index,'mime',mime,'label','Áudio '||(media_index+1)) order by media_index) filter(where kind='audio'),'[]'::jsonb) audio,
    coalesce(jsonb_agg(jsonb_build_object('index',media_index,'mime',mime,'label','Imagem '||(media_index+1)) order by media_index) filter(where kind='image'),'[]'::jsonb) images,
    coalesce(jsonb_agg(jsonb_build_object('index',media_index,'mime',mime,'label','Material '||(media_index+1)) order by media_index) filter(where kind='document'),'[]'::jsonb) documents
  from media
)
select jsonb_build_object(
  'lesson_id',p_lesson_id,'videos',videos,'audio',audio,'images',images,'documents',documents,
  'video_count',jsonb_array_length(videos),'audio_count',jsonb_array_length(audio),
  'image_count',jsonb_array_length(images),'document_count',jsonb_array_length(documents),
  'available',(jsonb_array_length(videos)+jsonb_array_length(audio)+jsonb_array_length(images)+jsonb_array_length(documents))>0
) from packed;
$$;

create or replace function nexora.lesson_media_resolve(p_lesson_id uuid,p_kind text,p_index integer)
returns jsonb
language plpgsql
stable
security definer
set search_path = nexora, nexora_private, public, auth
as $$
declare v_base text;v_filename text;v_mime text;
begin
  if p_kind not in ('video','audio','image','document') or p_index is null or p_index<0 then return null;end if;
  select p.source_asset_base into v_base
  from nexora.lessons l
  join nexora.modules m on m.id=l.module_id
  join nexora.ouro_lesson_bindings b on b.lc_lesson_id=l.id
  join nexora.ouro_source_lesson_payloads p on p.source_course_id=b.source_course_id and p.lesson_position=b.lesson_position
  where l.id=p_lesson_id
    and (nexora_private.is_admin() or (nexora_private.is_member() and exists(
      select 1 from nexora.enrollments e where e.course_id=m.course_id and e.user_id=auth.uid() and e.status in('active','completed')
    )))
  limit 1;
  if v_base is null or v_base !~ '^https://[A-Za-z0-9.-]+/' or lower(split_part(split_part(v_base,'://',2),'/',1))<>'jupiter.omcursos.com.br' then return null;end if;
  select f.filename,f.mime into v_filename,v_mime from nexora_private.lesson_media_files(p_lesson_id) f
  where f.kind=p_kind and f.media_index=p_index limit 1;
  if v_filename is null then return null;end if;
  return jsonb_build_object('url',v_base||v_filename,'mime',v_mime,'filename',v_filename);
end;
$$;

revoke all on function nexora.lesson_media_manifest(uuid) from public,anon;
revoke all on function nexora.lesson_media_resolve(uuid,text,integer) from public,anon;
grant execute on function nexora.lesson_media_manifest(uuid) to authenticated;
grant execute on function nexora.lesson_media_resolve(uuid,text,integer) to authenticated;

    and filename !~ '\.\.'
    and (
      (kind='video' and lower(filename) ~ '\\.mp4
),
numbered as (
  select kind,(row_number() over(partition by kind order by grp,ord,filename)-1)::integer media_index,filename
  from clean
)
select kind,media_index,filename,
  case
    when lower(filename) like '%.mp4' then 'video/mp4'
    when lower(filename) like '%.mp3' then 'audio/mpeg'
    when lower(filename) like '%.png' then 'image/png'
    when lower(filename) like '%.jpg' or lower(filename) like '%.jpeg' then 'image/jpeg'
    when lower(filename) like '%.webp' then 'image/webp'
    when lower(filename) like '%.gif' then 'image/gif'
    when lower(filename) like '%.pdf' then 'application/pdf'
    else 'application/octet-stream'
  end mime
from numbered
order by kind,media_index;
$$;

revoke all on function nexora_private.lesson_media_files(uuid) from public,anon,authenticated;

create or replace function nexora.lesson_media_manifest(p_lesson_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = nexora, nexora_private, public, auth
as $$
with media as (select * from nexora_private.lesson_media_files(p_lesson_id)),
packed as (
  select
    coalesce(jsonb_agg(jsonb_build_object('index',media_index,'mime',mime,'label','Vídeo '||(media_index+1)) order by media_index) filter(where kind='video'),'[]'::jsonb) videos,
    coalesce(jsonb_agg(jsonb_build_object('index',media_index,'mime',mime,'label','Áudio '||(media_index+1)) order by media_index) filter(where kind='audio'),'[]'::jsonb) audio,
    coalesce(jsonb_agg(jsonb_build_object('index',media_index,'mime',mime,'label','Imagem '||(media_index+1)) order by media_index) filter(where kind='image'),'[]'::jsonb) images,
    coalesce(jsonb_agg(jsonb_build_object('index',media_index,'mime',mime,'label','Material '||(media_index+1)) order by media_index) filter(where kind='document'),'[]'::jsonb) documents
  from media
)
select jsonb_build_object(
  'lesson_id',p_lesson_id,'videos',videos,'audio',audio,'images',images,'documents',documents,
  'video_count',jsonb_array_length(videos),'audio_count',jsonb_array_length(audio),
  'image_count',jsonb_array_length(images),'document_count',jsonb_array_length(documents),
  'available',(jsonb_array_length(videos)+jsonb_array_length(audio)+jsonb_array_length(images)+jsonb_array_length(documents))>0
) from packed;
$$;

create or replace function nexora.lesson_media_resolve(p_lesson_id uuid,p_kind text,p_index integer)
returns jsonb
language plpgsql
stable
security definer
set search_path = nexora, nexora_private, public, auth
as $$
declare v_base text;v_filename text;v_mime text;
begin
  if p_kind not in ('video','audio','image','document') or p_index is null or p_index<0 then return null;end if;
  select p.source_asset_base into v_base
  from nexora.lessons l
  join nexora.modules m on m.id=l.module_id
  join nexora.ouro_lesson_bindings b on b.lc_lesson_id=l.id
  join nexora.ouro_source_lesson_payloads p on p.source_course_id=b.source_course_id and p.lesson_position=b.lesson_position
  where l.id=p_lesson_id
    and (nexora_private.is_admin() or (nexora_private.is_member() and exists(
      select 1 from nexora.enrollments e where e.course_id=m.course_id and e.user_id=auth.uid() and e.status in('active','completed')
    )))
  limit 1;
  if v_base is null or v_base !~ '^https://[A-Za-z0-9.-]+/' or lower(split_part(split_part(v_base,'://',2),'/',1))<>'jupiter.omcursos.com.br' then return null;end if;
  select f.filename,f.mime into v_filename,v_mime from nexora_private.lesson_media_files(p_lesson_id) f
  where f.kind=p_kind and f.media_index=p_index limit 1;
  if v_filename is null then return null;end if;
  return jsonb_build_object('url',v_base||v_filename,'mime',v_mime,'filename',v_filename);
end;
$$;

revoke all on function nexora.lesson_media_manifest(uuid) from public,anon;
revoke all on function nexora.lesson_media_resolve(uuid,text,integer) from public,anon;
grant execute on function nexora.lesson_media_manifest(uuid) to authenticated;
grant execute on function nexora.lesson_media_resolve(uuid,text,integer) to authenticated;
)
      or (kind='audio' and lower(filename) ~ '\\.mp3
),
numbered as (
  select kind,(row_number() over(partition by kind order by grp,ord,filename)-1)::integer media_index,filename
  from clean
)
select kind,media_index,filename,
  case
    when lower(filename) like '%.mp4' then 'video/mp4'
    when lower(filename) like '%.mp3' then 'audio/mpeg'
    when lower(filename) like '%.png' then 'image/png'
    when lower(filename) like '%.jpg' or lower(filename) like '%.jpeg' then 'image/jpeg'
    when lower(filename) like '%.webp' then 'image/webp'
    when lower(filename) like '%.gif' then 'image/gif'
    when lower(filename) like '%.pdf' then 'application/pdf'
    else 'application/octet-stream'
  end mime
from numbered
order by kind,media_index;
$$;

revoke all on function nexora_private.lesson_media_files(uuid) from public,anon,authenticated;

create or replace function nexora.lesson_media_manifest(p_lesson_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = nexora, nexora_private, public, auth
as $$
with media as (select * from nexora_private.lesson_media_files(p_lesson_id)),
packed as (
  select
    coalesce(jsonb_agg(jsonb_build_object('index',media_index,'mime',mime,'label','Vídeo '||(media_index+1)) order by media_index) filter(where kind='video'),'[]'::jsonb) videos,
    coalesce(jsonb_agg(jsonb_build_object('index',media_index,'mime',mime,'label','Áudio '||(media_index+1)) order by media_index) filter(where kind='audio'),'[]'::jsonb) audio,
    coalesce(jsonb_agg(jsonb_build_object('index',media_index,'mime',mime,'label','Imagem '||(media_index+1)) order by media_index) filter(where kind='image'),'[]'::jsonb) images,
    coalesce(jsonb_agg(jsonb_build_object('index',media_index,'mime',mime,'label','Material '||(media_index+1)) order by media_index) filter(where kind='document'),'[]'::jsonb) documents
  from media
)
select jsonb_build_object(
  'lesson_id',p_lesson_id,'videos',videos,'audio',audio,'images',images,'documents',documents,
  'video_count',jsonb_array_length(videos),'audio_count',jsonb_array_length(audio),
  'image_count',jsonb_array_length(images),'document_count',jsonb_array_length(documents),
  'available',(jsonb_array_length(videos)+jsonb_array_length(audio)+jsonb_array_length(images)+jsonb_array_length(documents))>0
) from packed;
$$;

create or replace function nexora.lesson_media_resolve(p_lesson_id uuid,p_kind text,p_index integer)
returns jsonb
language plpgsql
stable
security definer
set search_path = nexora, nexora_private, public, auth
as $$
declare v_base text;v_filename text;v_mime text;
begin
  if p_kind not in ('video','audio','image','document') or p_index is null or p_index<0 then return null;end if;
  select p.source_asset_base into v_base
  from nexora.lessons l
  join nexora.modules m on m.id=l.module_id
  join nexora.ouro_lesson_bindings b on b.lc_lesson_id=l.id
  join nexora.ouro_source_lesson_payloads p on p.source_course_id=b.source_course_id and p.lesson_position=b.lesson_position
  where l.id=p_lesson_id
    and (nexora_private.is_admin() or (nexora_private.is_member() and exists(
      select 1 from nexora.enrollments e where e.course_id=m.course_id and e.user_id=auth.uid() and e.status in('active','completed')
    )))
  limit 1;
  if v_base is null or v_base !~ '^https://[A-Za-z0-9.-]+/' or lower(split_part(split_part(v_base,'://',2),'/',1))<>'jupiter.omcursos.com.br' then return null;end if;
  select f.filename,f.mime into v_filename,v_mime from nexora_private.lesson_media_files(p_lesson_id) f
  where f.kind=p_kind and f.media_index=p_index limit 1;
  if v_filename is null then return null;end if;
  return jsonb_build_object('url',v_base||v_filename,'mime',v_mime,'filename',v_filename);
end;
$$;

revoke all on function nexora.lesson_media_manifest(uuid) from public,anon;
revoke all on function nexora.lesson_media_resolve(uuid,text,integer) from public,anon;
grant execute on function nexora.lesson_media_manifest(uuid) to authenticated;
grant execute on function nexora.lesson_media_resolve(uuid,text,integer) to authenticated;
)
      or (kind='image' and lower(filename) ~ '\\.(png|jpe?g|webp|gif)
),
numbered as (
  select kind,(row_number() over(partition by kind order by grp,ord,filename)-1)::integer media_index,filename
  from clean
)
select kind,media_index,filename,
  case
    when lower(filename) like '%.mp4' then 'video/mp4'
    when lower(filename) like '%.mp3' then 'audio/mpeg'
    when lower(filename) like '%.png' then 'image/png'
    when lower(filename) like '%.jpg' or lower(filename) like '%.jpeg' then 'image/jpeg'
    when lower(filename) like '%.webp' then 'image/webp'
    when lower(filename) like '%.gif' then 'image/gif'
    when lower(filename) like '%.pdf' then 'application/pdf'
    else 'application/octet-stream'
  end mime
from numbered
order by kind,media_index;
$$;

revoke all on function nexora_private.lesson_media_files(uuid) from public,anon,authenticated;

create or replace function nexora.lesson_media_manifest(p_lesson_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = nexora, nexora_private, public, auth
as $$
with media as (select * from nexora_private.lesson_media_files(p_lesson_id)),
packed as (
  select
    coalesce(jsonb_agg(jsonb_build_object('index',media_index,'mime',mime,'label','Vídeo '||(media_index+1)) order by media_index) filter(where kind='video'),'[]'::jsonb) videos,
    coalesce(jsonb_agg(jsonb_build_object('index',media_index,'mime',mime,'label','Áudio '||(media_index+1)) order by media_index) filter(where kind='audio'),'[]'::jsonb) audio,
    coalesce(jsonb_agg(jsonb_build_object('index',media_index,'mime',mime,'label','Imagem '||(media_index+1)) order by media_index) filter(where kind='image'),'[]'::jsonb) images,
    coalesce(jsonb_agg(jsonb_build_object('index',media_index,'mime',mime,'label','Material '||(media_index+1)) order by media_index) filter(where kind='document'),'[]'::jsonb) documents
  from media
)
select jsonb_build_object(
  'lesson_id',p_lesson_id,'videos',videos,'audio',audio,'images',images,'documents',documents,
  'video_count',jsonb_array_length(videos),'audio_count',jsonb_array_length(audio),
  'image_count',jsonb_array_length(images),'document_count',jsonb_array_length(documents),
  'available',(jsonb_array_length(videos)+jsonb_array_length(audio)+jsonb_array_length(images)+jsonb_array_length(documents))>0
) from packed;
$$;

create or replace function nexora.lesson_media_resolve(p_lesson_id uuid,p_kind text,p_index integer)
returns jsonb
language plpgsql
stable
security definer
set search_path = nexora, nexora_private, public, auth
as $$
declare v_base text;v_filename text;v_mime text;
begin
  if p_kind not in ('video','audio','image','document') or p_index is null or p_index<0 then return null;end if;
  select p.source_asset_base into v_base
  from nexora.lessons l
  join nexora.modules m on m.id=l.module_id
  join nexora.ouro_lesson_bindings b on b.lc_lesson_id=l.id
  join nexora.ouro_source_lesson_payloads p on p.source_course_id=b.source_course_id and p.lesson_position=b.lesson_position
  where l.id=p_lesson_id
    and (nexora_private.is_admin() or (nexora_private.is_member() and exists(
      select 1 from nexora.enrollments e where e.course_id=m.course_id and e.user_id=auth.uid() and e.status in('active','completed')
    )))
  limit 1;
  if v_base is null or v_base !~ '^https://[A-Za-z0-9.-]+/' or lower(split_part(split_part(v_base,'://',2),'/',1))<>'jupiter.omcursos.com.br' then return null;end if;
  select f.filename,f.mime into v_filename,v_mime from nexora_private.lesson_media_files(p_lesson_id) f
  where f.kind=p_kind and f.media_index=p_index limit 1;
  if v_filename is null then return null;end if;
  return jsonb_build_object('url',v_base||v_filename,'mime',v_mime,'filename',v_filename);
end;
$$;

revoke all on function nexora.lesson_media_manifest(uuid) from public,anon;
revoke all on function nexora.lesson_media_resolve(uuid,text,integer) from public,anon;
grant execute on function nexora.lesson_media_manifest(uuid) to authenticated;
grant execute on function nexora.lesson_media_resolve(uuid,text,integer) to authenticated;
)
      or (kind='document' and lower(filename) ~ '\\.pdf
),
numbered as (
  select kind,(row_number() over(partition by kind order by grp,ord,filename)-1)::integer media_index,filename
  from clean
)
select kind,media_index,filename,
  case
    when lower(filename) like '%.mp4' then 'video/mp4'
    when lower(filename) like '%.mp3' then 'audio/mpeg'
    when lower(filename) like '%.png' then 'image/png'
    when lower(filename) like '%.jpg' or lower(filename) like '%.jpeg' then 'image/jpeg'
    when lower(filename) like '%.webp' then 'image/webp'
    when lower(filename) like '%.gif' then 'image/gif'
    when lower(filename) like '%.pdf' then 'application/pdf'
    else 'application/octet-stream'
  end mime
from numbered
order by kind,media_index;
$$;

revoke all on function nexora_private.lesson_media_files(uuid) from public,anon,authenticated;

create or replace function nexora.lesson_media_manifest(p_lesson_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = nexora, nexora_private, public, auth
as $$
with media as (select * from nexora_private.lesson_media_files(p_lesson_id)),
packed as (
  select
    coalesce(jsonb_agg(jsonb_build_object('index',media_index,'mime',mime,'label','Vídeo '||(media_index+1)) order by media_index) filter(where kind='video'),'[]'::jsonb) videos,
    coalesce(jsonb_agg(jsonb_build_object('index',media_index,'mime',mime,'label','Áudio '||(media_index+1)) order by media_index) filter(where kind='audio'),'[]'::jsonb) audio,
    coalesce(jsonb_agg(jsonb_build_object('index',media_index,'mime',mime,'label','Imagem '||(media_index+1)) order by media_index) filter(where kind='image'),'[]'::jsonb) images,
    coalesce(jsonb_agg(jsonb_build_object('index',media_index,'mime',mime,'label','Material '||(media_index+1)) order by media_index) filter(where kind='document'),'[]'::jsonb) documents
  from media
)
select jsonb_build_object(
  'lesson_id',p_lesson_id,'videos',videos,'audio',audio,'images',images,'documents',documents,
  'video_count',jsonb_array_length(videos),'audio_count',jsonb_array_length(audio),
  'image_count',jsonb_array_length(images),'document_count',jsonb_array_length(documents),
  'available',(jsonb_array_length(videos)+jsonb_array_length(audio)+jsonb_array_length(images)+jsonb_array_length(documents))>0
) from packed;
$$;

create or replace function nexora.lesson_media_resolve(p_lesson_id uuid,p_kind text,p_index integer)
returns jsonb
language plpgsql
stable
security definer
set search_path = nexora, nexora_private, public, auth
as $$
declare v_base text;v_filename text;v_mime text;
begin
  if p_kind not in ('video','audio','image','document') or p_index is null or p_index<0 then return null;end if;
  select p.source_asset_base into v_base
  from nexora.lessons l
  join nexora.modules m on m.id=l.module_id
  join nexora.ouro_lesson_bindings b on b.lc_lesson_id=l.id
  join nexora.ouro_source_lesson_payloads p on p.source_course_id=b.source_course_id and p.lesson_position=b.lesson_position
  where l.id=p_lesson_id
    and (nexora_private.is_admin() or (nexora_private.is_member() and exists(
      select 1 from nexora.enrollments e where e.course_id=m.course_id and e.user_id=auth.uid() and e.status in('active','completed')
    )))
  limit 1;
  if v_base is null or v_base !~ '^https://[A-Za-z0-9.-]+/' or lower(split_part(split_part(v_base,'://',2),'/',1))<>'jupiter.omcursos.com.br' then return null;end if;
  select f.filename,f.mime into v_filename,v_mime from nexora_private.lesson_media_files(p_lesson_id) f
  where f.kind=p_kind and f.media_index=p_index limit 1;
  if v_filename is null then return null;end if;
  return jsonb_build_object('url',v_base||v_filename,'mime',v_mime,'filename',v_filename);
end;
$$;

revoke all on function nexora.lesson_media_manifest(uuid) from public,anon;
revoke all on function nexora.lesson_media_resolve(uuid,text,integer) from public,anon;
grant execute on function nexora.lesson_media_manifest(uuid) to authenticated;
grant execute on function nexora.lesson_media_resolve(uuid,text,integer) to authenticated;
)
    )
  order by kind,filename,grp,ord
),
numbered as (
  select kind,(row_number() over(partition by kind order by grp,ord,filename)-1)::integer media_index,filename
  from clean
)
select kind,media_index,filename,
  case
    when lower(filename) like '%.mp4' then 'video/mp4'
    when lower(filename) like '%.mp3' then 'audio/mpeg'
    when lower(filename) like '%.png' then 'image/png'
    when lower(filename) like '%.jpg' or lower(filename) like '%.jpeg' then 'image/jpeg'
    when lower(filename) like '%.webp' then 'image/webp'
    when lower(filename) like '%.gif' then 'image/gif'
    when lower(filename) like '%.pdf' then 'application/pdf'
    else 'application/octet-stream'
  end mime
from numbered
order by kind,media_index;
$$;

revoke all on function nexora_private.lesson_media_files(uuid) from public,anon,authenticated;

create or replace function nexora.lesson_media_manifest(p_lesson_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = nexora, nexora_private, public, auth
as $$
with media as (select * from nexora_private.lesson_media_files(p_lesson_id)),
packed as (
  select
    coalesce(jsonb_agg(jsonb_build_object('index',media_index,'mime',mime,'label','Vídeo '||(media_index+1)) order by media_index) filter(where kind='video'),'[]'::jsonb) videos,
    coalesce(jsonb_agg(jsonb_build_object('index',media_index,'mime',mime,'label','Áudio '||(media_index+1)) order by media_index) filter(where kind='audio'),'[]'::jsonb) audio,
    coalesce(jsonb_agg(jsonb_build_object('index',media_index,'mime',mime,'label','Imagem '||(media_index+1)) order by media_index) filter(where kind='image'),'[]'::jsonb) images,
    coalesce(jsonb_agg(jsonb_build_object('index',media_index,'mime',mime,'label','Material '||(media_index+1)) order by media_index) filter(where kind='document'),'[]'::jsonb) documents
  from media
)
select jsonb_build_object(
  'lesson_id',p_lesson_id,'videos',videos,'audio',audio,'images',images,'documents',documents,
  'video_count',jsonb_array_length(videos),'audio_count',jsonb_array_length(audio),
  'image_count',jsonb_array_length(images),'document_count',jsonb_array_length(documents),
  'available',(jsonb_array_length(videos)+jsonb_array_length(audio)+jsonb_array_length(images)+jsonb_array_length(documents))>0
) from packed;
$$;

create or replace function nexora.lesson_media_resolve(p_lesson_id uuid,p_kind text,p_index integer)
returns jsonb
language plpgsql
stable
security definer
set search_path = nexora, nexora_private, public, auth
as $$
declare v_base text;v_filename text;v_mime text;
begin
  if p_kind not in ('video','audio','image','document') or p_index is null or p_index<0 then return null;end if;
  select p.source_asset_base into v_base
  from nexora.lessons l
  join nexora.modules m on m.id=l.module_id
  join nexora.ouro_lesson_bindings b on b.lc_lesson_id=l.id
  join nexora.ouro_source_lesson_payloads p on p.source_course_id=b.source_course_id and p.lesson_position=b.lesson_position
  where l.id=p_lesson_id
    and (nexora_private.is_admin() or (nexora_private.is_member() and exists(
      select 1 from nexora.enrollments e where e.course_id=m.course_id and e.user_id=auth.uid() and e.status in('active','completed')
    )))
  limit 1;
  if v_base is null or v_base !~ '^https://[A-Za-z0-9.-]+/' or lower(split_part(split_part(v_base,'://',2),'/',1))<>'jupiter.omcursos.com.br' then return null;end if;
  select f.filename,f.mime into v_filename,v_mime from nexora_private.lesson_media_files(p_lesson_id) f
  where f.kind=p_kind and f.media_index=p_index limit 1;
  if v_filename is null then return null;end if;
  return jsonb_build_object('url',v_base||v_filename,'mime',v_mime,'filename',v_filename);
end;
$$;

revoke all on function nexora.lesson_media_manifest(uuid) from public,anon;
revoke all on function nexora.lesson_media_resolve(uuid,text,integer) from public,anon;
grant execute on function nexora.lesson_media_manifest(uuid) to authenticated;
grant execute on function nexora.lesson_media_resolve(uuid,text,integer) to authenticated;
