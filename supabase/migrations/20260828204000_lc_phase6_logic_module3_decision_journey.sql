do $$
declare
  v_course uuid;
  v_module uuid;
begin
  select id into v_course from nexora.courses where title='Lógica de Programação Básica' limit 1;
  select id into v_module from nexora.modules where course_id=v_course and position=3 limit 1;

  update nexora.lessons set content=$json$[
    {"type":"specification","title":"Comece pela regra, não pelo IF","body":"Requisito: frete grátis em pedidos de R$ 200 ou mais. Antes de pensar em SE, escreva a pergunta, identifique os dados necessários, a fronteira e os resultados esperados. A condição é apenas a formalização dessa especificação."},
    {"type":"concept","title":"Condição é uma pergunta booleana","body":"`valorPedido >= LIMITE_FRETE` responde verdadeiro ou falso. Ela não executa a ação. Separar pergunta e consequência permite provar a lógica sem misturar cálculo, mensagem ou navegação."},
    {"type":"boundary_probe","title":"Prove a pergunta na fronteira","items":["199 → falso","200 → verdadeiro","201 → verdadeiro"]},
    {"type":"case_study","title":"Caso: bloqueio por tentativas inválidas","body":"Regra: bloquear quando houver 3 ou mais tentativas inválidas. Escreva a condição e explique por que 2, 3 e 4 são casos melhores que 10, 20 e 30 para validar a regra."},
    {"type":"error_analysis","title":"Pergunta errada, ação certa ainda produz bug","body":"Se a condição usar `tentativas > 3`, a ação de bloquear pode estar perfeitamente implementada e mesmo assim o sistema aceitar uma tentativa a mais. Teste a condição como uma unidade verificável."},
    {"type":"transfer","title":"Transfira para outro domínio","body":"Escolha uma regra de estoque, idade ou meta comercial. Reescreva-a no formato: dado observado → pergunta → fronteira → casos de prova. Não escreva ainda os ramos da decisão."}
  ]$json$::jsonb, estimated_minutes=30, updated_at=now() where module_id=v_module and position=1;

  update nexora.lessons set content=$json$[
    {"type":"bifurcation","title":"Dois caminhos precisam cobrir o domínio válido","body":"SE/SENÃO comunica uma bifurcação: quando a condição é verdadeira, um caminho; quando é falsa, outro. Para dados válidos, os ramos devem ser mutuamente exclusivos e juntos cobrir todos os casos previstos."},
    {"type":"worked_example","title":"Frete como decisão binária","body":"`SE valorPedido >= LIMITE_FRETE → frete = 0`\n`SENÃO → frete = FRETE_PADRAO`\nCom 250, somente o primeiro ramo. Com 150, somente o segundo."},
    {"type":"trace_table","title":"Faça teste de mesa dos dois ramos","items":["valor=250 → condição verdadeira → frete 0","valor=150 → condição falsa → frete padrão","valor=200 → condição verdadeira → frete 0"]},
    {"type":"comparison","title":"SE/SENÃO × dois IFs","items":["SE/SENÃO declara exclusividade.","Dois IFs independentes podem executar ambos se houver sobreposição.","SENÃO é útil quando o restante válido compartilha uma única consequência.","Sem ação no caso falso, o SENÃO pode ser desnecessário."]},
    {"type":"domain_check","title":"O SENÃO realmente representa o restante?","body":"Se `valorPedido` puder estar ausente ou inválido, SENÃO passa a misturar pedido abaixo do limite com erro de entrada. Valide o domínio antes ou trate o terceiro estado explicitamente."},
    {"type":"practice","title":"Especifique dois caminhos completos","body":"Crie uma decisão aceitar/recusar para um cenário de cadastro. Liste uma entrada que vai para cada ramo e uma entrada inválida que não deveria ser confundida com o ramo falso."},
    {"type":"professional_context","title":"Bifurcações aparecem em permissões e políticas","body":"Aplicar/não aplicar desconto, liberar/bloquear recurso e aceitar/recusar cadastro são decisões binárias comuns. A clareza dos dois caminhos reduz divergência entre produto, teste e implementação."}
  ]$json$::jsonb, estimated_minutes=34, updated_at=now() where module_id=v_module and position=2;

  update nexora.lessons set content=$json$[
    {"type":"classification_problem","title":"Classificar é particionar o domínio","body":"Quando existem três ou mais resultados, o problema deixa de ser apenas verdadeiro/falso e passa a ser dividir entradas em faixas que não podem ter lacunas nem sobreposição ambígua."},
    {"type":"concept","title":"A primeira condição verdadeira encerra a cadeia","body":"Em SENÃO SE, a ordem é parte da regra. Uma condição ampla cedo demais pode capturar entradas que deveriam chegar a uma faixa mais específica."},
    {"type":"interval_model","title":"Modele as faixas como intervalos","items":["Aprovado: [7, +∞)","Recuperação: [5, 7)","Reprovado: (-∞, 5)"]},
    {"type":"worked_example","title":"Da faixa para a cadeia","body":"`SE nota >= 7 → Aprovado`\n`SENÃO SE nota >= 5 → Recuperação`\n`SENÃO → Reprovado`\nA ordem do maior limite para o menor impede que uma nota 9 pare em recuperação."},
    {"type":"decision_table","title":"Prove as duas fronteiras","items":["4,9 → Reprovado","5 → Recuperação","6,9 → Recuperação","7 → Aprovado","9 → Aprovado"]},
    {"type":"bug_hunt","title":"Encontre a faixa inalcançável","body":"Troque a ordem: teste `nota >= 5` antes de `nota >= 7`. Identifique quais casos passam a receber resultado errado e explique por que a segunda condição se torna parcialmente inalcançável."},
    {"type":"transfer","title":"Construa outra classificação","body":"Modele três faixas para prioridade, risco ou comissão. Declare intervalos primeiro, depois escreva a cadeia. O objetivo é demonstrar cobertura, não apenas sintaxe."}
  ]$json$::jsonb, estimated_minutes=38, updated_at=now() where module_id=v_module and position=3;

  update nexora.lessons set content=$json$[
    {"type":"authorization_case","title":"Caso de autorização: obrigatório + alternativas","body":"Regra: acesso premium exige conta ativa E (plano Pro OU papel de administrador). Esse tipo de regra aparece em permissões porque mistura um requisito obrigatório com alternativas de perfil."},
    {"type":"decomposition","title":"Nomeie as perguntas antes de combiná-las","items":["contaAtiva?","planoPro?","admin?","temPerfilPremium = planoPro || admin","podeAcessar = contaAtiva && temPerfilPremium"]},
    {"type":"case_matrix","title":"Casos que realmente diferenciam as expressões","items":["ativa=true, pro=true, admin=false → libera","ativa=true, pro=false, admin=true → libera","ativa=false, pro=true, admin=false → bloqueia","ativa=true, pro=false, admin=false → bloqueia"]},
    {"type":"comparison","title":"E restringe; OU amplia","body":"Trocar E por OU altera a população autorizada. Em regras de acesso, um operador permissivo demais pode liberar quem deveria ser recusado mesmo que todos os nomes e valores estejam corretos."},
    {"type":"red_team","title":"Tente quebrar sua própria regra","body":"Crie um cenário em que exatamente uma condição obrigatória falha. Depois crie um em que somente uma alternativa do grupo é verdadeira. Se a expressão não produz o resultado esperado, o agrupamento está errado."},
    {"type":"refactor","title":"Reduza a carga de raciocínio","body":"Prefira booleanos intermediários com nomes do domínio a uma expressão longa. Isso melhora leitura, logs e testes sem alterar a semântica."},
    {"type":"professional_context","title":"Decisões compostas são controles de acesso","body":"Status da conta, papel, propriedade e contexto frequentemente participam da mesma autorização. Testes negativos são tão importantes quanto os casos liberados."}
  ]$json$::jsonb, estimated_minutes=38, updated_at=now() where module_id=v_module and position=4;

  update nexora.lessons set content=$json$[
    {"type":"decision_tree","title":"Quando a próxima pergunta depende da resposta anterior","body":"Aninhamento é justificável quando o resultado da primeira decisão muda quais perguntas seguintes fazem sentido. Não é um recurso para simplesmente agrupar muitos IFs."},
    {"type":"case_study","title":"Saque em etapas","body":"Primeiro: existe saldo suficiente? Se não, recuse por saldo. Somente se houver saldo, pergunte se o limite diário permite o saque. A segunda pergunta não é relevante quando a primeira já encerrou o caso."},
    {"type":"tree_model","title":"Desenhe os nós e saídas","items":["saldo suficiente? não → Recusar: saldo","saldo suficiente? sim → verificar limite","excede limite? sim → Recusar: limite","excede limite? não → Aprovar"]},
    {"type":"comparison","title":"Árvore × condição composta","items":["Use condição composta quando as perguntas pertencem ao mesmo nível lógico.","Use árvore quando existe dependência de contexto.","Use guard clauses quando podem encerrar casos cedo e reduzir profundidade."]},
    {"type":"refactor_lab","title":"Achate a pirâmide","body":"Pegue uma decisão com pelo menos três níveis de IF. Identifique validações que podem encerrar cedo e reescreva o caminho principal de forma mais linear, preservando os motivos de cada saída."},
    {"type":"auditability","title":"Motivos de saída fazem parte da decisão","body":"Aprovar, recusar por saldo e recusar por limite não são apenas resultados técnicos; são explicações operacionais úteis para suporte, analytics e auditoria."},
    {"type":"self_check","title":"Quando aninhar?","items":["A segunda pergunta só existe em um dos ramos?","Os motivos de saída continuam claros?","É possível reduzir profundidade sem perder contexto?","A árvore cobre todos os caminhos válidos?"]}
  ]$json$::jsonb, estimated_minutes=38, updated_at=now() where module_id=v_module and position=5;

  update nexora.lessons set content=$json$[
    {"type":"verification_lab","title":"Tabela de decisão como especificação executável","body":"Com dois booleanos existem quatro combinações. Uma tabela torna todas visíveis e obriga a equipe a definir a saída esperada antes de olhar a implementação."},
    {"type":"truth_table","title":"Acesso exige conta ativa E e-mail verificado","items":["V, V → liberar","V, F → bloquear","F, V → bloquear","F, F → bloquear"]},
    {"type":"method","title":"Derive a expectativa do requisito","items":["Liste entradas relevantes.","Defina a saída esperada sem consultar o código.","Transforme linhas em testes.","Compare implementação com a tabela, não o contrário."]},
    {"type":"case_expansion","title":"Três booleanos aumentam o espaço de combinações","body":"Com três condições existem até oito combinações. Nem todas precisam virar casos visíveis na interface, mas a cobertura deve ser uma decisão consciente, priorizando riscos e combinações que distinguem regras concorrentes."},
    {"type":"cross_functional","title":"Produto e operação também conseguem revisar a tabela","body":"Uma matriz de entrada e saída traduz regra de negócio sem exigir leitura de código. Isso facilita alinhamento entre desenvolvimento, comercial, jurídico e suporte."},
    {"type":"practice","title":"Construa a tabela de uma regra real","body":"Use `temDocumento && (maiorDeIdade || autorizado)`. Liste casos que isolem cada condição e indique a saída esperada antes de escrever qualquer expressão."},
    {"type":"anti_pattern","title":"Não copie o bug para o teste","body":"Se a expectativa é criada olhando a implementação, ela pode repetir o mesmo erro. O requisito deve ser a fonte independente da tabela."}
  ]$json$::jsonb, estimated_minutes=36, updated_at=now() where module_id=v_module and position=6;

  update nexora.lessons set content=$json$[
    {"type":"production_incident","title":"Ausente, inválido e não elegível não são o mesmo estado","body":"Se idade está vazia, tratar `idade >= 18` como falso transforma erro de entrada em recusa legítima. Sistemas robustos preservam a diferença entre dado ruim e resultado da regra."},
    {"type":"validation_pipeline","title":"Valide antes de classificar","items":["Está presente?","Tem formato correto?","Está no domínio plausível?","Só então aplique a regra de negócio."]},
    {"type":"case_matrix","title":"Cinco entradas, três classes de resultado","items":["21 → válido e aprovado","17 → válido e recusado","ausente → revisar dados","-4 → revisar dados","\"vinte\" → revisar dados"]},
    {"type":"guard_clauses","title":"Encerre falhas de pré-condição cedo","body":"Se idade ausente → solicitar dado. Se formato inválido → erro de formato. Se fora do domínio → erro de domínio. Depois disso, o caminho principal pode avaliar maioridade com dado confiável."},
    {"type":"observability","title":"Registre o motivo, não apenas o resultado","body":"Estados como `dados_incompletos`, `formato_invalido` e `nao_elegivel` permitem medir onde o processo falha e orientar atendimento sem interpretar logs vagos."},
    {"type":"unexpected_state","title":"Fallback genérico não deve esconder novidade","body":"Quando um estado novo aparece, um SENÃO genérico pode mascarar ausência de tratamento. Em sistemas críticos, sinalize estados inesperados para revisão."},
    {"type":"capstone","title":"Desafio: motor de elegibilidade robusto","body":"Modele uma decisão com pelo menos uma pré-condição, uma fronteira de negócio, dois resultados legítimos e um estado de revisão de dados. Entregue também a matriz de testes que prova cada classe."},
    {"type":"mastery","title":"Critério de domínio do módulo","items":["Especifico perguntas antes dos ramos.","Provo fronteiras e faixas.","Separo obrigatório de alternativas.","Uso árvore apenas quando há dependência de contexto.","Derivo testes do requisito.","Separo entrada inválida de resultado legítimo."]}
  ]$json$::jsonb, estimated_minutes=46, updated_at=now() where module_id=v_module and position=7;

  update nexora.assessments set title='Checkpoint aplicado — Decisões, cobertura e exceções', max_attempts=3 where course_id=v_course and module_id=v_module;

  insert into nexora.learning_resources(course_id,module_id,title,resource_type,summary,content,position,status)
  select v_course,v_module,'Template — Especificação de decisão','template','Modelo reutilizável para documentar regra, pré-condições, fronteiras, ramos, exceções e casos de prova antes da implementação.',
  $json${"sections":[{"title":"1. Regra","items":["Qual decisão precisa ser tomada?","Quais dados são necessários?","Quais pré-condições precisam ser válidas?"]},{"title":"2. Caminhos","items":["Quais resultados legítimos existem?","Há faixas ou alternativas?","Alguma pergunta depende de uma resposta anterior?"]},{"title":"3. Exceções","items":["O que acontece com dado ausente?","O que acontece com formato inválido?","Existe estado inesperado que deve ser sinalizado?"]},{"title":"4. Prova","items":["Caso falso","Caso verdadeiro","Fronteira","Combinação negativa","Entrada inválida"]}],"editorial_version":"lc-content-standard-1.0"}$json$::jsonb,5,'published'
  where not exists(select 1 from nexora.learning_resources where module_id=v_module and title='Template — Especificação de decisão');
end $$;
