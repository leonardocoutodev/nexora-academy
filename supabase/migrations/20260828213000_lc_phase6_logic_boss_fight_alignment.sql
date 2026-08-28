update nexora.projects p
set description='Construa um motor de triagem ou atendimento que receba uma coleção de registros, valide dados, aplique regras de prioridade com fronteiras explícitas, percorra e agregue resultados e organize a solução em funções com responsabilidades claras. A entrega deve ser executável ou demonstrável por pseudocódigo, fluxograma ou código e precisa incluir uma matriz de testes. Entregue também uma explicação curta de como reproduzir pelo menos um caso válido, um caso de fronteira, um caso inválido e um caso com coleção vazia.',
    rubric=$json${
      "version":"lc-content-standard-1.0",
      "minimum_score":70,
      "deliverables":[
        "Artefato principal: pseudocódigo, fluxograma ou código demonstrável",
        "Matriz com casos de teste e resultados esperados",
        "Explicação curta para reprodução da solução"
      ],
      "required_evidence":[
        "validação de entrada antes da regra de negócio",
        "ao menos uma fronteira testada exatamente no limite",
        "percurso de coleção com estado observável",
        "uso de função com parâmetros e retorno ou contrato equivalente",
        "tratamento explícito de coleção vazia ou ausência de registros"
      ],
      "criteria":[
        {"name":"Modelagem e decomposição","weight":20,"evidence":"Dados e responsabilidades estão nomeados; o problema foi dividido em etapas compreensíveis."},
        {"name":"Correção das regras","weight":25,"evidence":"Pré-condições, limites e resultados correspondem ao requisito, sem confundir dado inválido com resultado legítimo."},
        {"name":"Uso coerente dos fundamentos","weight":20,"evidence":"Decisões, repetição, funções e coleções são usadas por necessidade do problema e não apenas para cumprir checklist."},
        {"name":"Testes e casos de fronteira","weight":20,"evidence":"A entrega inclui casos comuns, fronteira, inválido e coleção vazia com resultado esperado definido antes da execução."},
        {"name":"Clareza e reprodutibilidade","weight":15,"evidence":"Outra pessoa consegue executar ou simular a solução e entender por que cada resultado foi produzido."}
      ],
      "review_guidance":{
        "approved":"Aprovar somente quando a evidência demonstra domínio integrado e nota final >= 70.",
        "revision_requested":"Solicitar ajustes citando o critério específico e uma ação verificável para nova submissão."
      }
    }$json$::jsonb
from nexora.courses c
where p.course_id=c.id
  and c.title='Lógica de Programação Básica'
  and p.project_kind='boss_fight';
