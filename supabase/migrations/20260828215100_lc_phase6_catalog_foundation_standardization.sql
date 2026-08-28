-- LC Phase 6 — Catalog foundation standardization
-- Idempotent data migration for the six foundation courses.
-- Applies LC Content Standard 1.0 without changing course IDs or completion rules.

with target as (
  select
    l.id,l.title,l.content,l.lab_config,l.lab_type,l.position,
    m.id module_id,m.title module_title,m.position module_position,
    c.title course_title,
    max(l.position) over(partition by m.id) as last_position,
    mod(m.position + l.position,4) as mode
  from nexora.lessons l
  join nexora.modules m on m.id=l.module_id
  join nexora.courses c on c.id=m.course_id
  where l.status='published'
    and c.status='published'
    and c.title in (
      'Pensamento Computacional',
      'Pseudocódigo e Fluxogramas',
      'Matemática Básica para Programadores',
      'Terminal e Git para Iniciantes',
      'Introdução à Web',
      'Primeiros Passos com Python'
    )
    and coalesce(l.lab_config->>'editorial_version','') <> 'lc-content-standard-1.0-catalog-foundation'
),
rewritten as (
  select t.*,
    (
      select coalesce(jsonb_agg(
        case
          when e.elem->>'type'='guided_practice' then
            jsonb_build_object(
              'type','guided_practice',
              'title','Oficina: '||t.title,
              'body',
                case t.course_title
                  when 'Pensamento Computacional' then 'Pegue um problema cotidiano relacionado a "'||t.title||'" e produza uma solução que outra pessoa consiga revisar. Explicite o que foi decomposto, o padrão percebido, o que foi abstraído e como você saberá que o plano funciona.'
                  when 'Pseudocódigo e Fluxogramas' then 'Represente "'||t.title||'" sem depender de uma linguagem real. Antes de considerar a solução pronta, faça um teste de mesa e confirme se cada entrada percorre o caminho esperado até uma saída observável.'
                  when 'Matemática Básica para Programadores' then 'Modele uma situação numérica usando "'||t.title||'". Registre fórmula, unidades, ordem das operações e resultado esperado; depois teste um valor comum e um valor de fronteira para procurar erro de interpretação ou arredondamento.'
                  when 'Terminal e Git para Iniciantes' then 'Execute ou simule "'||t.title||'" como parte de um fluxo de desenvolvimento. Antes do comando, registre o estado atual; depois, confira a saída e o estado resultante. Em comandos destrutivos, descreva também como evitar perda acidental.'
                  when 'Introdução à Web' then 'Construa um fragmento de página que demonstre "'||t.title||'". Valide no navegador, inspecione o resultado e faça pelo menos um teste adicional de acessibilidade, conteúdo ausente, entrada inválida ou largura de tela.'
                  when 'Primeiros Passos com Python' then 'Implemente "'||t.title||'" em Python. Primeiro preveja a saída; depois execute, compare previsão e resultado e use a mensagem do interpretador ou os valores observados para corrigir qualquer divergência.'
                end,
              'items',
                case t.course_title
                  when 'Pensamento Computacional' then jsonb_build_array('Defina o problema em uma frase verificável.','Separe partes, dados e restrições relevantes.','Compare pelo menos duas maneiras de resolver.','Use um contraexemplo ou caso-limite para testar o plano.')
                  when 'Pseudocódigo e Fluxogramas' then jsonb_build_array('Defina entradas e saídas.','Escreva os passos com indentação consistente.','Faça um teste de mesa com valores concretos.','Revise se o fluxograma/pseudocódigo conta a mesma história.')
                  when 'Matemática Básica para Programadores' then jsonb_build_array('Declare valores e unidades.','Escreva a expressão antes de calcular.','Teste a fronteira ou um valor extremo razoável.','Explique por que o resultado faz sentido no domínio.')
                  when 'Terminal e Git para Iniciantes' then jsonb_build_array('Registre o diretório/repositório atual.','Explique o efeito do comando antes de executá-lo.','Leia a saída em vez de presumir sucesso.','Confirme o estado final com um comando de inspeção.')
                  when 'Introdução à Web' then jsonb_build_array('Crie uma versão mínima funcional.','Inspecione estrutura/estilo/comportamento no navegador.','Teste uma condição diferente da demonstração.','Corrija sem quebrar semântica ou acessibilidade.')
                  when 'Primeiros Passos com Python' then jsonb_build_array('Preveja a saída ou estado final.','Execute com uma entrada comum.','Teste uma fronteira ou entrada inválida quando aplicável.','Explique a causa de qualquer erro antes de alterar o código.')
                end
            )
          when e.elem->>'type'='mastery' then
            jsonb_build_object(
              'type','mastery',
              'title','Evidências de domínio',
              'items',
                case t.course_title
                  when 'Pensamento Computacional' then jsonb_build_array('Consigo transformar um problema ambíguo em partes verificáveis.','Consigo justificar o que mantive e o que abstraí.','Consigo comparar soluções e apontar um teste que poderia refutá-las.')
                  when 'Pseudocódigo e Fluxogramas' then jsonb_build_array('Consigo representar a lógica sem depender de sintaxe de linguagem.','Consigo acompanhar estado e fluxo com teste de mesa.','Consigo detectar divergência entre representação e resultado esperado.')
                  when 'Matemática Básica para Programadores' then jsonb_build_array('Consigo escolher a operação ou fórmula adequada.','Consigo manter unidades, precedência e limites explícitos.','Consigo validar o resultado com estimativa ou caso de fronteira.')
                  when 'Terminal e Git para Iniciantes' then jsonb_build_array('Consigo explicar o estado antes e depois do comando.','Consigo interpretar a saída e recuperar o contexto quando algo dá errado.','Consigo evitar operações destrutivas sem verificação.')
                  when 'Introdução à Web' then jsonb_build_array('Consigo produzir uma página funcional e semanticamente coerente.','Consigo explicar o efeito de estrutura, estilo e comportamento.','Consigo validar em mais de um estado, entrada ou largura de tela.')
                  when 'Primeiros Passos com Python' then jsonb_build_array('Consigo escrever e executar uma solução sem depender de cópia cega.','Consigo prever e verificar a saída para entradas diferentes.','Consigo usar traceback ou estado das variáveis para localizar um erro.')
                end
            )
          else replace(e.elem::text,'Nexora','LC — Learn & Create')::jsonb
        end
        order by e.ord
      ) filter (where not (t.mode in (2,3) and e.elem->>'type'='purpose')), '[]'::jsonb)
      from jsonb_array_elements(coalesce(t.content,'[]'::jsonb)) with ordinality e(elem,ord)
    ) as base_content
  from target t
),
assembled as (
  select r.*,
    jsonb_build_object(
      'type',case when r.mode in (0,1) then 'professional_context' else 'story' end,
      'title',case r.course_title
        when 'Pensamento Computacional' then 'Problema antes da solução'
        when 'Pseudocódigo e Fluxogramas' then 'Revisão antes do código'
        when 'Matemática Básica para Programadores' then 'Número com significado'
        when 'Terminal e Git para Iniciantes' then 'Estado, comando e evidência'
        when 'Introdução à Web' then 'Do requisito ao navegador'
        when 'Primeiros Passos com Python' then 'Prever antes de executar'
      end,
      'body',case r.course_title
        when 'Pensamento Computacional' then 'Uma equipe recebeu uma solicitação incompleta e precisa usar "'||r.title||'" para transformar o problema em um plano que possa ser explicado, testado e revisado antes de qualquer implementação.'
        when 'Pseudocódigo e Fluxogramas' then 'Antes de programar, duas pessoas precisam concordar sobre a lógica de "'||r.title||'". A representação deve ser clara o bastante para que ambas façam o mesmo teste de mesa e obtenham o mesmo resultado.'
        when 'Matemática Básica para Programadores' then 'Um cálculo usado por software precisa aplicar "'||r.title||'" sem perder unidade, limite ou ordem de operação. O resultado só é confiável quando a expressão e os casos de teste tornam a regra explícita.'
        when 'Terminal e Git para Iniciantes' then 'Em um projeto real, "'||r.title||'" altera ou revela estado do ambiente. O objetivo não é decorar comandos: é saber onde você está, o que pretende mudar e como confirmar o efeito.'
        when 'Introdução à Web' then 'Um requisito de interface precisa ser convertido em comportamento observável no navegador usando "'||r.title||'". Estrutura, aparência, interação e acessibilidade devem continuar coerentes quando o conteúdo ou a tela muda.'
        when 'Primeiros Passos com Python' then 'Um pequeno programa precisa usar "'||r.title||'" de forma previsível. Antes de executar, você registra o que espera acontecer; depois usa saída, estado ou erro do interpretador como evidência.'
      end
    ) as context_block,
    jsonb_build_object(
      'type','recap',
      'title','Fechamento: '||r.title,
      'items',case r.course_title
        when 'Pensamento Computacional' then jsonb_build_array('Problema definido antes da solução.','Decisões justificadas.','Teste capaz de revelar uma falha.')
        when 'Pseudocódigo e Fluxogramas' then jsonb_build_array('Entradas e saídas explícitas.','Fluxo legível.','Teste de mesa confirma o comportamento.')
        when 'Matemática Básica para Programadores' then jsonb_build_array('Expressão e unidades explícitas.','Precedência e fronteiras verificadas.','Resultado interpretado no contexto.')
        when 'Terminal e Git para Iniciantes' then jsonb_build_array('Estado inicial conhecido.','Comando entendido antes da execução.','Estado final verificado.')
        when 'Introdução à Web' then jsonb_build_array('Estrutura com significado.','Resultado verificado no navegador.','Um segundo estado ou largura também foi testado.')
        when 'Primeiros Passos com Python' then jsonb_build_array('Saída prevista antes de rodar.','Execução observada.','Erro explicado antes de corrigir.')
      end
    ) as recap_block
  from rewritten r
),
finalized as (
  select a.*,
    case a.mode
      when 0 then jsonb_build_array(a.context_block) || a.base_content || jsonb_build_array(a.recap_block)
      when 1 then jsonb_build_array(a.context_block) || a.base_content
      when 2 then a.base_content || jsonb_build_array(a.recap_block)
      else a.base_content
    end as new_content,
    case a.course_title
      when 'Pensamento Computacional' then case a.position
        when 1 then 'logic' when 2 then 'logic' when 3 then 'logic' when 4 then 'checkpoint'
        when 5 then 'pseudocode' when 6 then 'checkpoint' when 7 then 'logic' else 'pseudocode' end
      when 'Pseudocódigo e Fluxogramas' then case when a.position in (1,2,3,4,5,7,8) then 'pseudocode' else 'logic' end
      when 'Matemática Básica para Programadores' then case
        when a.module_position=1 and a.position in (3,4,5) then 'spreadsheet'
        when a.module_position=2 and a.position in (4,5,6) then 'spreadsheet'
        else 'logic' end
      when 'Terminal e Git para Iniciantes' then case when a.position in (1,6) then 'checkpoint' else 'terminal' end
      when 'Introdução à Web' then case
        when a.module_position=1 and a.position=1 then 'checkpoint'
        when a.module_position=2 and a.position=6 then 'javascript'
        else 'html' end
      when 'Primeiros Passos com Python' then 'python'
    end as new_lab_type,
    case a.course_title
      when 'Pensamento Computacional' then 'Aplicar "'||a.title||'" a um problema real, justificando a decomposição, as abstrações e um teste capaz de revelar uma falha.'
      when 'Pseudocódigo e Fluxogramas' then 'Representar "'||a.title||'" de forma independente de linguagem, executar um teste de mesa e demonstrar que entradas, decisões e saídas permanecem coerentes.'
      when 'Matemática Básica para Programadores' then 'Modelar e verificar uma situação de programação usando "'||a.title||'", com expressão, unidades, fronteiras e interpretação do resultado explícitas.'
      when 'Terminal e Git para Iniciantes' then 'Executar ou simular "'||a.title||'" com segurança, explicando o estado antes do comando, o efeito esperado e a evidência usada para confirmar o resultado.'
      when 'Introdução à Web' then 'Construir e validar uma demonstração de "'||a.title||'" no navegador, preservando semântica, comportamento observável e pelo menos um teste adicional de acessibilidade, entrada ou responsividade.'
      when 'Primeiros Passos com Python' then 'Implementar e testar "'||a.title||'" em Python, prevendo a saída, executando casos diferentes e explicando erros ou divergências a partir de evidências.'
    end as new_objective,
    case when a.position=a.last_position then 45 when a.mode=0 then 38 when a.mode=1 then 36 else 34 end as new_minutes
  from assembled a
)
update nexora.lessons l
set content=f.new_content,
    objective=f.new_objective,
    estimated_minutes=f.new_minutes,
    lab_type=f.new_lab_type,
    lab_config=coalesce(l.lab_config,'{}'::jsonb) || jsonb_build_object(
      'editorial_version','lc-content-standard-1.0-catalog-foundation',
      'pedagogy','contextualizar-modelar-praticar-validar',
      'evidence_expectation','previsão, execução/simulação, caso alternativo e explicação da evidência'
    )
from finalized f
where l.id=f.id;

update nexora.projects p
set rubric=coalesce(p.rubric,'{}'::jsonb) || jsonb_build_object(
  'version','lc-content-standard-1.0',
  'minimum_score',70,
  'deliverables',case c.title
    when 'Pensamento Computacional' then jsonb_build_array('Mapa do problema e decomposição','Algoritmo/plano verificável','Casos de teste e justificativa das abstrações')
    when 'Pseudocódigo e Fluxogramas' then jsonb_build_array('Pseudocódigo estruturado','Fluxograma coerente com o pseudocódigo','Teste de mesa com resultado esperado')
    when 'Matemática Básica para Programadores' then jsonb_build_array('Modelo numérico com fórmulas e unidades','Casos comuns e de fronteira','Interpretação dos resultados')
    when 'Terminal e Git para Iniciantes' then jsonb_build_array('Sequência reproduzível de comandos','Evidência de estado antes/depois','Histórico Git ou registro equivalente do fluxo')
    when 'Introdução à Web' then jsonb_build_array('Página/site funcional','Evidências de semântica e responsividade','Teste de interação/acessibilidade e instruções de reprodução')
    when 'Primeiros Passos com Python' then jsonb_build_array('Programa Python executável','Casos de teste com saídas esperadas','Explicação curta de decisões e tratamento de erro') end,
  'required_evidence',case c.title
    when 'Pensamento Computacional' then jsonb_build_array('decomposição explícita','abstração justificada','comparação ou critério de escolha','caso-limite/contraexemplo')
    when 'Pseudocódigo e Fluxogramas' then jsonb_build_array('entradas e saídas','decisões/repetições legíveis quando aplicáveis','teste de mesa','coerência entre representações')
    when 'Matemática Básica para Programadores' then jsonb_build_array('fórmula/expressão explícita','unidades ou escala','fronteira testada','validação independente do resultado')
    when 'Terminal e Git para Iniciantes' then jsonb_build_array('estado inicial','comandos e intenção','saída/estado final','precaução para operação destrutiva ou recuperação')
    when 'Introdução à Web' then jsonb_build_array('HTML semântico','estilo/comportamento observável','teste em largura ou estado alternativo','critério básico de acessibilidade')
    when 'Primeiros Passos com Python' then jsonb_build_array('execução reproduzível','mais de uma entrada','resultado esperado comparado ao obtido','tratamento ou explicação de erro relevante') end,
  'review_guidance',jsonb_build_object(
    'approved','Aprovar somente quando as evidências exigidas estão reproduzíveis e a nota final é maior ou igual a 70.',
    'revision_requested','Indicar o critério não demonstrado, citar a evidência ausente e pedir uma ação verificável para a nova submissão.'
  )
)
from nexora.courses c
where p.course_id=c.id and p.status='published'
  and c.title in ('Pensamento Computacional','Pseudocódigo e Fluxogramas','Matemática Básica para Programadores','Terminal e Git para Iniciantes','Introdução à Web','Primeiros Passos com Python');
