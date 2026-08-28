-- Nexora Academy: pedagogical quality pass and curated open library.
-- The backup tables make the editorial rewrite recoverable.

create table if not exists nexora_private.lessons_before_quality_20260828
as table nexora.lessons with no data;

insert into nexora_private.lessons_before_quality_20260828
select l.* from nexora.lessons l
where not exists (select 1 from nexora_private.lessons_before_quality_20260828 b where b.id = l.id);

create table if not exists nexora_private.projects_before_quality_20260828
as table nexora.projects with no data;

insert into nexora_private.projects_before_quality_20260828
select p.* from nexora.projects p
where not exists (select 1 from nexora_private.projects_before_quality_20260828 b where b.id = p.id);

alter table nexora.learning_resources
  add column if not exists external_url text,
  add column if not exists license_name text,
  add column if not exists license_url text,
  add column if not exists attribution text,
  add column if not exists language text not null default 'pt-BR',
  add column if not exists is_external boolean not null default false,
  add column if not exists accessed_at date;

alter table nexora.learning_resources
  drop constraint if exists learning_resources_external_url_https;
alter table nexora.learning_resources
  add constraint learning_resources_external_url_https
  check (external_url is null or external_url ~ '^https://');

grant select (external_url, license_name, license_url, attribution, language, is_external, accessed_at)
  on nexora.learning_resources to authenticated;

-- Every objective now names the lesson and requires observable evidence.
update nexora.lessons l
set objective = format(
  'Ao concluir esta aula, você deverá explicar “%s”, aplicar esse conhecimento em uma atividade verificável e validar o resultado com um caso comum e um caso-limite.',
  l.title
), updated_at = now();

-- Remove five repeated editorial fillers and replace them with lesson-specific practice and mastery criteria.
update nexora.lessons l
set content = coalesce((
    select jsonb_agg(block order by ord)
    from jsonb_array_elements(l.content) with ordinality as x(block, ord)
    where coalesce(block->>'type','') not in ('guided','recap','deep_dive','professional_context','guided_analysis')
  ), '[]'::jsonb)
  || jsonb_build_array(
    jsonb_build_object(
      'type','guided_practice',
      'title','Prática orientada: ' || l.title,
      'body',format('Resolva uma situação nova usando “%s”. Antes de executar, registre a entrada, a regra aplicada e o resultado previsto; depois compare previsão e resultado.', l.title),
      'items',jsonb_build_array(
        'Defina uma entrada comum e um caso-limite.',
        'Explique o procedimento com suas próprias palavras.',
        'Execute ou simule a solução e registre a evidência.',
        'Se o resultado divergir, localize a etapa que precisa ser corrigida.'
      )
    ),
    jsonb_build_object(
      'type','mastery',
      'title','Critérios de domínio',
      'items',jsonb_build_array(
        format('Consigo explicar “%s” sem copiar a definição.', l.title),
        'Consigo aplicar o conceito em um exemplo diferente do apresentado.',
        'Consigo justificar como validei o resultado e reconhecer um erro provável.'
      )
    )
  ),
  estimated_minutes = greatest(20, least(50, 14 + jsonb_array_length(l.content) * 2)),
  updated_at = now();

-- Checkpoints ask for application, not recall. Rotate answer position in stored data.
with checkpoints as (
  select id, lab_config, jsonb_array_length(lab_config->'checkpoint'->'options') as n,
         (abs(hashtext(id::text)) % jsonb_array_length(lab_config->'checkpoint'->'options'))::int as shift
  from nexora.lessons
  where lab_type='checkpoint'
    and jsonb_typeof(lab_config->'checkpoint'->'options')='array'
    and jsonb_array_length(lab_config->'checkpoint'->'options') > 1
), rotated as (
  select c.id, c.lab_config, c.n, c.shift,
         (select jsonb_agg(value order by ((ord - 1 - c.shift + c.n) % c.n))
          from jsonb_array_elements(c.lab_config->'checkpoint'->'options') with ordinality e(value,ord)) as options
  from checkpoints c
)
update nexora.lessons l
set lab_config = jsonb_set(
    jsonb_set(
      jsonb_set(r.lab_config, '{checkpoint,options}', r.options),
      '{checkpoint,answer}', to_jsonb(((coalesce((r.lab_config->'checkpoint'->>'answer')::int,0) - r.shift + r.n) % r.n))
    ),
    '{checkpoint,question}',
    to_jsonb(format('Em qual alternativa “%s” foi aplicado de modo mais preciso e verificável?', l.title))
  ), updated_at=now()
from rotated r where r.id=l.id;

-- Project briefs explicitly require evidence and testing.
update nexora.projects p
set description = trim(p.description) ||
  ' A entrega deve incluir: escopo e critérios de aceite; artefato executável ou demonstrável; evidências de pelo menos um teste comum, um caso-limite e um cenário de erro; README curto com decisões, limitações e instruções de reprodução.'
where length(trim(p.description)) < 220
  and p.description not like '%critérios de aceite%';

-- Make repeated question prompts contextual without changing assessment behavior.
update nexora.questions q
set prompt = q.prompt || ' — contexto: ' || a.title
from nexora.assessments a
where a.id=q.assessment_id
  and exists (select 1 from nexora.questions q2 where q2.prompt=q.prompt and q2.id<>q.id);

-- Curated links only: no third-party file is copied or redistributed.
insert into nexora.learning_resources
  (course_id,title,resource_type,summary,content,position,status,external_url,license_name,license_url,attribution,language,is_external,accessed_at)
select c.id, v.title, 'reference', v.summary, '[]'::jsonb, 0, 'published', v.url,
       v.license_name, v.license_url, v.attribution, v.language, true, date '2026-08-28'
from (values
 ('Lógica de Programação Básica','Curso de Lógica de Programação — EduCAPES','Apostila pública para fundamentos, algoritmos e resolução de problemas.','https://educapes.capes.gov.br/bitstream/capes/560827/2/Apostila%20-%20Curso%20de%20L%C3%B3gica%20de%20Programa%C3%A7%C3%A3o.pdf','Termos no documento','https://educapes.capes.gov.br/','EduCAPES / CAPES','pt-BR'),
 ('Pensamento Computacional','Curso de Lógica de Programação — EduCAPES','Leitura de apoio para decomposição, abstração, algoritmos e validação.','https://educapes.capes.gov.br/bitstream/capes/560827/2/Apostila%20-%20Curso%20de%20L%C3%B3gica%20de%20Programa%C3%A7%C3%A3o.pdf','Termos no documento','https://educapes.capes.gov.br/','EduCAPES / CAPES','pt-BR'),
 ('Pseudocódigo e Fluxogramas','Curso de Lógica de Programação — EduCAPES','Apostila de apoio para representação e teste de algoritmos.','https://educapes.capes.gov.br/bitstream/capes/560827/2/Apostila%20-%20Curso%20de%20L%C3%B3gica%20de%20Programa%C3%A7%C3%A3o.pdf','Termos no documento','https://educapes.capes.gov.br/','EduCAPES / CAPES','pt-BR'),
 ('Matemática Básica para Programadores','Precalculus 2e — OpenStax','Livro aberto e revisado por pares para funções, álgebra e modelagem.','https://openstax.org/details/books/precalculus-2e','CC BY 4.0','https://creativecommons.org/licenses/by/4.0/','OpenStax, Rice University','en'),
 ('Terminal e Git para Iniciantes','Pro Git, 2ª edição','Livro oficial e gratuito sobre Git, do básico a fluxos colaborativos.','https://git-scm.com/book/pt-br/v2','CC BY-NC-SA 3.0','https://creativecommons.org/licenses/by-nc-sa/3.0/','Scott Chacon e Ben Straub / git-scm.com','pt-BR'),
 ('Introdução à Web','MDN — Aprenda desenvolvimento web','Currículo oficial MDN para HTML, CSS, JavaScript, acessibilidade e boas práticas.','https://developer.mozilla.org/pt-BR/docs/Learn_web_development','CC BY-SA 2.5','https://creativecommons.org/licenses/by-sa/2.5/','Mozilla Contributors / MDN','pt-BR'),
 ('Primeiros Passos com Python','Tutorial oficial do Python 3','Tutorial mantido pelo projeto Python para linguagem, estruturas e funções.','https://docs.python.org/pt-br/3/tutorial/index.html','PSF License 2','https://docs.python.org/3/license.html','Python Software Foundation','pt-BR'),
 ('IA Generativa para Trabalho e Negócios','Guia para IA generativa na educação e na pesquisa','Referência UNESCO para uso responsável, riscos, oportunidades e governança.','https://unesdoc.unesco.org/ark:/48223/pf0000390241','Termos da UNESCO','https://www.unesco.org/en/open-access/cc-sa','UNESCO','pt-BR'),
 ('Desenvolvimento de Sistemas com IA','Generative AI for Beginners','Curso aberto da Microsoft com 21 lições e exemplos em Python e TypeScript.','https://github.com/microsoft/generative-ai-for-beginners','MIT','https://github.com/microsoft/generative-ai-for-beginners/blob/main/LICENSE','Microsoft','pt-BR')
) as v(course_title,title,summary,url,license_name,license_url,attribution,language)
join nexora.courses c on c.title=v.course_title
where not exists (
  select 1 from nexora.learning_resources r where r.course_id=c.id and r.external_url=v.url
);
