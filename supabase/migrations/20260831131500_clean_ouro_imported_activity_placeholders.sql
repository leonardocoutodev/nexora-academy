-- Remove synthetic activity placeholders generated during the Ouro Moderno bulk import.
-- Keep source_migration metadata so provenance remains auditable.
update nexora.lessons
set
  content = case
    when jsonb_typeof(content) = 'array' then (
      select coalesce(jsonb_agg(item order by ord), '[]'::jsonb)
      from jsonb_array_elements(content) with ordinality as x(item, ord)
      where not (
        lower(coalesce(item->>'type','')) = 'guided_practice'
        and (
          coalesce(item->>'title','') = 'Atividade — coloque em prática'
          or coalesce(item->>'body','') ilike 'Explique com suas próprias palavras%'
        )
      )
    )
    else content
  end,
  lab_type = 'none',
  lab_config = coalesce(lab_config, '{}'::jsonb) - 'checkpoint',
  updated_at = now()
where (lab_config->'source_migration'->>'provider') = 'Ouro Moderno'
  and lab_type = 'checkpoint';
