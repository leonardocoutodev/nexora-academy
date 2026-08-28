-- LC Phase 6 — AI catalog standardization
-- Standardizes all published lessons and project rubrics in the two large AI courses.

with target as (
  select l.id,l.title,l.content,l.lab_config,l.lab_type,l.position,
         m.id module_id,m.title module_title,m.position module_position,
         c.title course_title,
         max(l.position) over(partition by m.id) last_position,
         mod(m.position+l.position,4) mode
  from nexora.lessons l
  join nexora.modules m on m.id=l.module_id
  join nexora.courses c on c.id=m.course_id
  where l.status='published' and c.status='published'
    and c.title in ('Desenvolvimento de Sistemas com IA','IA Generativa para Trabalho e Negócios')
    and coalesce(l.lab_config->>'editorial_version','') <> 'lc-content-standard-1.0-catalog-ai'
),
rewritten as (
  select t.*,
    (
      select coalesce(jsonb_agg(
        case
          when e.elem->>'type'='guided_practice' then jsonb_build_object(
            'type','guided_practice',
            'title','Laboratório orientado: '||t.title,
            'body',
            case
              when t.course_title='Desenvolvimento de Sistemas com IA' then case t.module_position
                when 1 then 'Modele "'||t.title||'" como uma regra verificável. Defina entrada, estado, saída e pelo menos um caso de fronteira antes de implementar.'
                when 2 then 'Construa uma evidência de "'||t.title||'" no navegador. Verifique estrutura, comportamento e uma condição alternativa de conteúdo, largura ou acessibilidade.'
                when 3 then 'Implemente "'||t.title||'" em JavaScript, preveja o estado antes da execução e teste um caminho normal, um limite e uma entrada problemática.'
                when 4 then 'Simule "'||t.title||'" em um repositório. Registre estado inicial, comando/ação, diff ou saída e estado final antes de considerar o fluxo concluído.'
                when 5 then 'Use IA para apoiar "'||t.title||'", mas trate a resposta como proposta: registre o pedido, revise o diff, execute testes e explique o que foi aceito, alterado ou rejeitado.'
                when 6 then 'Modele "'||t.title||'" em TypeScript com contratos explícitos. Force um caso incompatível e use o compilador ou validação para provar que o contrato protege a solução.'
                when 7 then 'Implemente "'||t.title||'" em um componente React pequeno. Observe props/estado/renderização e teste pelo menos uma interação ou estado vazio.'
                when 8 then 'Modele "'||t.title||'" no banco. Declare estrutura/consulta, execute um caso válido e um caso que desafie restrição, cardinalidade, ausência ou consistência.'
                when 9 then 'Modele "'||t.title||'" como contrato de API. Registre request, status, resposta esperada e tratamento para entrada inválida, falha externa ou repetição da chamada.'
                when 10 then 'Analise "'||t.title||'" separando autenticação de autorização. Defina quem pode fazer o quê, qual evidência comprova a decisão e qual cenário deve ser negado.'
                when 11 then 'Rastreie "'||t.title||'" de ponta a ponta: interface, validação, API, persistência e retorno. Marque onde um erro pode nascer e como ele será observado.'
                when 12 then 'Transforme "'||t.title||'" em critério de qualidade. Escreva o comportamento esperado, um teste que falha antes da correção e a evidência que prova a regressão resolvida.'
                when 13 then 'Execute ou simule "'||t.title||'" no fluxo Cloudflare. Diferencie ambiente local e produção, registre saída de build/deploy e defina como observar uma falha.'
                when 14 then 'Trate "'||t.title||'" como decisão de produto. Defina usuário, problema, hipótese, critério de aceite e uma métrica ou evidência que poderia contradizer a hipótese.'
                else 'Integre "'||t.title||'" ao projeto final com uma entrega reproduzível. Registre requisito, implementação, teste, evidência de qualidade e instrução de demonstração.'
              end
              else case t.module_position
                when 1 then 'Aplique "'||t.title||'" comparando capacidade e limite do modelo. Registre a entrada, a resposta, um ponto que exige verificação humana e o critério usado para aceitar ou rejeitar a saída.'
                when 2 then 'Construa e itere um prompt para "'||t.title||'". Defina objetivo, contexto, restrições e critério de qualidade; altere uma variável por vez e compare as versões.'
                when 3 then 'Use "'||t.title||'" em uma tarefa de pesquisa. Separe afirmação, fonte/evidência e grau de confiança; procure uma confirmação independente antes de reutilizar o resultado.'
                when 4 then 'Produza uma peça de comunicação usando "'||t.title||'", com público, intenção e tom definidos. Revise fatos, ambiguidade, promessa indevida e adequação ao canal antes de publicar.'
                when 5 then 'Aplique "'||t.title||'" a um conjunto pequeno de dados. Registre a pergunta, a transformação/fórmula, o resultado e uma checagem independente que revele erro de cálculo ou interpretação.'
                when 6 then 'Explore "'||t.title||'" como direção criativa: escreva critérios visuais, gere/compare alternativas conceituais e registre o que precisa de revisão humana, autorização ou consistência de marca.'
                when 7 then 'Use "'||t.title||'" para apoiar uma tarefa de trabalho, mantendo responsabilidade humana. Defina o que pode ser delegado, o que precisa de revisão e qual evidência confirma que a saída atende ao objetivo.'
                when 8 then 'Modele "'||t.title||'" como integração de API. Registre payload, resposta, erro esperado, custo/limite relevante e uma estratégia para não depender de uma única resposta bem-sucedida.'
                when 9 then 'Desenhe "'||t.title||'" como automação observável. Defina gatilho, entradas, ação, saída, falha, reprocessamento e como evitar efeitos duplicados.'
                when 10 then 'Valide "'||t.title||'" em um fluxo RAG: pergunta, trechos recuperados, resposta e evidência citável. Inclua um caso em que a base não contém resposta suficiente.'
                when 11 then 'Projete "'||t.title||'" com ferramentas e limites explícitos. Defina permissão, estado, critério de parada, log de ações e um caminho seguro quando a ferramenta falhar.'
                when 12 then 'Analise "'||t.title||'" como decisão de governança. Classifique dados e risco, defina aprovação humana, registre o que não deve ser enviado ao modelo e descreva uma resposta segura a conteúdo não confiável.'
                else 'Integre "'||t.title||'" ao projeto final com objetivo de negócio, artefato demonstrável, verificação factual/técnica, análise de risco e instrução de reprodução.'
              end
            end,
            'items',case when t.course_title='Desenvolvimento de Sistemas com IA'
              then jsonb_build_array('Defina o comportamento observável antes de implementar.','Produza o menor artefato que demonstre a competência.','Teste um caminho de falha, limite ou estado vazio.','Registre evidência suficiente para outra pessoa reproduzir a validação.')
              else jsonb_build_array('Defina objetivo e critério de qualidade antes de usar IA.','Guarde entrada, saída e alterações feitas por você.','Verifique fato, cálculo, fonte ou comportamento quando aplicável.','Registre risco, limite ou decisão que continua sob responsabilidade humana.') end
          )
          when e.elem->>'type'='mastery' then jsonb_build_object(
            'type','mastery','title','Critérios de domínio profissional',
            'items',case when t.course_title='Desenvolvimento de Sistemas com IA'
              then jsonb_build_array('Consigo produzir uma evidência técnica reproduzível, não apenas explicar o conceito.','Consigo testar um caminho normal e um caminho de falha ou fronteira.','Consigo justificar decisões de implementação e localizar onde observar um problema.')
              else jsonb_build_array('Consigo usar IA com objetivo e critério de qualidade explícitos.','Consigo verificar a saída em vez de assumir que está correta.','Consigo identificar limite, risco e ponto de revisão humana antes de reutilizar o resultado.') end
          )
          else replace(e.elem::text,'Nexora','LC — Learn & Create')::jsonb
        end order by e.ord
      ) filter(where not(t.mode in (2,3) and e.elem->>'type'='purpose')), '[]'::jsonb)
      from jsonb_array_elements(coalesce(t.content,'[]'::jsonb)) with ordinality e(elem,ord)
    ) base_content
  from target t
),
assembled as (
  select r.*,
    jsonb_build_object(
      'type',case when r.mode in (0,1) then 'professional_context' else 'story' end,
      'title',case when r.course_title='Desenvolvimento de Sistemas com IA' then 'Cenário de engenharia' else 'Cenário de uso responsável' end,
      'body',case when r.course_title='Desenvolvimento de Sistemas com IA'
        then 'No módulo "'||r.module_title||'", uma equipe precisa demonstrar "'||r.title||'" com comportamento observável, evidência técnica e um caminho de falha conhecido. A entrega só é considerada pronta quando outra pessoa consegue reproduzir a verificação.'
        else 'No módulo "'||r.module_title||'", "'||r.title||'" será usado em uma tarefa real de trabalho ou negócio. A qualidade depende tanto da saída quanto da verificação, da rastreabilidade e da decisão sobre o que continua sob responsabilidade humana.' end
    ) context_block,
    jsonb_build_object(
      'type','recap','title','Checklist de saída',
      'items',case when r.course_title='Desenvolvimento de Sistemas com IA'
        then jsonb_build_array('Artefato ou comportamento reproduzível.','Teste de caminho alternativo/falha.','Decisão técnica justificada.','Evidência observável registrada.')
        else jsonb_build_array('Objetivo e critério de qualidade explícitos.','Entrada e saída rastreáveis.','Verificação independente quando necessária.','Risco/limite e revisão humana registrados.') end
    ) recap_block
  from rewritten r
),
finalized as (
  select a.*,
    case a.mode when 0 then jsonb_build_array(a.context_block)||a.base_content||jsonb_build_array(a.recap_block)
      when 1 then jsonb_build_array(a.context_block)||a.base_content
      when 2 then a.base_content||jsonb_build_array(a.recap_block) else a.base_content end new_content,
    case
      when a.course_title='Desenvolvimento de Sistemas com IA' and a.lab_type='checkpoint' then case a.module_position
        when 1 then 'logic' when 2 then 'html' when 3 then 'javascript' when 4 then 'terminal'
        when 5 then 'code_ai' when 6 then 'typescript' when 7 then 'react' when 8 then 'sql'
        when 9 then 'api' when 10 then 'auth' when 11 then 'api' when 12 then 'code_ai'
        when 13 then 'terminal' when 14 then 'product' when 15 then 'product' else a.lab_type end
      when a.course_title='IA Generativa para Trabalho e Negócios' and a.lab_type='checkpoint' then case a.module_position
        when 1 then case when a.position in (2,4,6,8) then 'prompt' else 'checkpoint' end
        when 2 then 'prompt' when 3 then 'prompt' when 4 then 'prompt' when 5 then 'spreadsheet'
        when 6 then 'prompt' when 7 then 'prompt' when 8 then 'api' when 9 then 'automation'
        when 10 then 'rag' when 11 then 'agent' when 12 then 'checkpoint' when 13 then 'product'
        else a.lab_type end
      else a.lab_type end new_lab_type,
    case when a.course_title='Desenvolvimento de Sistemas com IA'
      then 'Implementar e validar "'||a.title||'" no contexto de "'||a.module_title||'", produzindo evidência técnica reproduzível, um teste de caminho alternativo ou falha e uma justificativa das decisões principais.'
      else 'Aplicar "'||a.title||'" no contexto de "'||a.module_title||'" com objetivo e critério de qualidade explícitos, saída rastreável, verificação apropriada e registro do limite, risco ou revisão humana necessária.' end new_objective,
    case when a.position=a.last_position then 48 when a.mode=0 then 42 when a.mode=1 then 39 else 36 end new_minutes
  from assembled a
)
update nexora.lessons l
set content=f.new_content,objective=f.new_objective,lab_type=f.new_lab_type,estimated_minutes=f.new_minutes,
    lab_config=coalesce(l.lab_config,'{}'::jsonb)||jsonb_build_object(
      'editorial_version','lc-content-standard-1.0-catalog-ai',
      'pedagogy','contexto-evidencia-falha-revisao',
      'evidence_expectation',case when f.course_title='Desenvolvimento de Sistemas com IA'
        then 'artefato reproduzível, caminho alternativo/falha e justificativa técnica'
        else 'entrada/saída rastreáveis, verificação e limite/risco com revisão humana' end
    )
from finalized f where l.id=f.id;

with pt as (
  select p.id project_id,c.title course_title,m.title module_title,m.position module_position
  from nexora.projects p join nexora.courses c on c.id=p.course_id
  left join nexora.modules m on m.id=p.module_id
  where p.status='published' and c.title in ('Desenvolvimento de Sistemas com IA','IA Generativa para Trabalho e Negócios')
)
update nexora.projects p
set rubric=coalesce(p.rubric,'{}'::jsonb)||jsonb_build_object(
  'version','lc-content-standard-1.0','minimum_score',70,
  'deliverables',case pt.course_title
    when 'Desenvolvimento de Sistemas com IA' then case when pt.module_position=15
      then jsonb_build_array('Aplicação integrada demonstrável','Repositório/artefato com instruções de reprodução','Plano e evidências de testes','Registro de decisões, segurança/qualidade e limitações conhecidas')
      else jsonb_build_array('Artefato técnico demonstrável do módulo','Instruções de reprodução','Evidência de teste ou comportamento','Nota curta sobre decisões e limitações') end
    else case when pt.module_position=13
      then jsonb_build_array('Solução de IA aplicada a um problema real','Entradas, saídas e iterações rastreáveis','Verificação factual/técnica e evidências','Análise de risco, privacidade e responsabilidade humana')
      else jsonb_build_array('Artefato ou workflow demonstrável do módulo','Registro de entradas e saídas','Evidência de verificação','Nota curta sobre risco, limite e revisão humana') end end,
  'required_evidence',case pt.course_title
    when 'Desenvolvimento de Sistemas com IA' then jsonb_build_array(
      'competência central do módulo "'||coalesce(pt.module_title,'Projeto final')||'" demonstrada por comportamento observável',
      'ao menos um caminho alternativo, erro, fronteira ou estado vazio testado',
      'instrução suficiente para outra pessoa reproduzir','decisão técnica principal justificada')
    else jsonb_build_array(
      'competência central do módulo "'||coalesce(pt.module_title,'Projeto final')||'" demonstrada em uma tarefa realista',
      'entrada e saída preservadas para rastreabilidade','verificação de fato, cálculo, fonte ou comportamento quando aplicável',
      'limite, risco ou decisão de revisão humana explicitado') end,
  'review_guidance',jsonb_build_object(
    'approved','Aprovar somente quando a entrega é reproduzível, demonstra a competência do módulo e atinge nota final maior ou igual a 70.',
    'revision_requested','Citar o critério não demonstrado, a evidência ausente e uma ação verificável para a próxima submissão.'
  )
)
from pt where p.id=pt.project_id;
