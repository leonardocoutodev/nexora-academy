do $$
declare
  v_course uuid;
  v_module uuid;
begin
  select id into v_course from nexora.courses where title='Lógica de Programação Básica' limit 1;
  select id into v_module from nexora.modules where course_id=v_course and position=2 limit 1;

  update nexora.lessons set content=$json$[
    {"type":"story","title":"Um sistema não guarda números; guarda significado","body":"Em um orçamento comercial, 149.90 pode ser preço, mensalidade, desconto acumulado ou saldo. O valor sozinho não explica seu papel. Antes de qualquer cálculo, a solução precisa nomear o estado do problema."},
    {"type":"concept","title":"Variável é uma representação do estado","body":"Uma variável associa um nome estável a um valor que pode mudar. O nome descreve a responsabilidade; o valor descreve o estado atual. `totalPedido` pode passar de 80 para 125 sem deixar de representar o total do pedido."},
    {"type":"comparison","title":"Compare nomes pela capacidade de explicar","items":["`x` exige contexto externo para ser entendido.","`valor` ainda é genérico quando existem vários valores.","`totalPedido` comunica domínio e responsabilidade.","`totalPedidoCentavos` comunica também a unidade quando isso evita ambiguidade."]},
    {"type":"case_study","title":"Caso: orçamento que muda durante a negociação","body":"Um cliente escolhe um curso, altera a forma de pagamento e adiciona um material. Modele pelo menos quatro variáveis para representar preço-base, desconto aplicado, valor final e forma de pagamento. Em seguida, indique quais podem mudar durante a negociação e quais não deveriam mudar sem uma nova regra."},
    {"type":"guided_practice","title":"Faça a leitura inversa","body":"Leia estes nomes sem ver o código: `quantidadeParcelas`, `clienteAtivo`, `taxaDesconto`, `limiteCredito`. Para cada um, escreva qual tipo de valor espera encontrar e que mudança de estado faria sentido. Se o nome não permite uma hipótese razoável, ele está fraco."},
    {"type":"professional_context","title":"Nomes são parte da qualidade do sistema","body":"Variáveis aparecem em código, logs, testes, dashboards e investigação de incidentes. Bons nomes diminuem o tempo de diagnóstico e evitam que regras diferentes compartilhem rótulos vagos."}
  ]$json$::jsonb, estimated_minutes=30, updated_at=now() where module_id=v_module and position=1;

  update nexora.lessons set content=$json$[
    {"type":"problem","title":"O problema dos números mágicos","body":"Uma regra usa 300 como limite de desconto em quatro pontos diferentes. Meses depois, a campanha muda para 350. Se ninguém souber onde o número representa essa regra — e onde 300 representa outra coisa — a alteração vira risco."},
    {"type":"concept","title":"Constante dá nome a uma decisão da regra","body":"`LIMITE_DESCONTO = 300` não torna o número eterno; torna explícito que ele deve permanecer estável durante aquela versão da regra. Constantes reduzem duplicação semântica e tornam mudanças intencionais."},
    {"type":"case_study","title":"Mesmo valor, três significados","body":"Considere `LIMITE_DESCONTO = 300`, `META_VENDAS = 300` e `ESTOQUE_ALERTA = 300`. O valor é igual, mas as políticas são independentes. Centralizar pelo número seria um erro; centralizar pelo significado é o objetivo."},
    {"type":"decision","title":"Quando criar uma constante?","items":["Quando o valor representa limite, taxa, configuração ou política.","Quando uma mudança deveria ocorrer em um único ponto controlado.","Quando o valor aparece em múltiplas expressões com o mesmo significado.","Quando o número isolado não explica por que existe."]},
    {"type":"practice","title":"Refatore uma política de frete","body":"Regra: pedidos abaixo de R$ 200 pagam R$ 20 de frete. Separe estado e política. Depois simule a mudança do limite para R$ 250 e verifique quantos pontos da solução precisam ser alterados."},
    {"type":"mistake","title":"Constante não é sinônimo de hardcode","body":"Uma constante pode receber valor de configuração, banco ou ambiente. O princípio é que o restante da solução trate aquele valor como uma regra nomeada, em vez de espalhar números sem contexto."}
  ]$json$::jsonb, estimated_minutes=28, updated_at=now() where module_id=v_module and position=2;

  update nexora.lessons set content=$json$[
    {"type":"diagnostic","title":"Antes de começar: que tipo é cada dado?","items":["idade = 18","cpf = 12345678900","aceitouTermos = true","salarioDigitado = \"2500.00\"","cep = \"45653-000\""]},
    {"type":"concept","title":"Tipo expressa o que é permitido fazer com um dado","body":"Número representa quantidade e participa de cálculos. Texto representa sequência ou identificador. Booleano representa estado lógico. O tipo correto nasce do significado, não da aparência visual."},
    {"type":"comparison","title":"Dígitos não transformam identificador em número","items":["CPF e telefone continuam sendo identificadores textuais.","Quantidade de itens é número porque operações aritméticas fazem sentido.","CEP pode conter hífen e zeros à esquerda, reforçando sua natureza textual.","Valores vindos de formulário podem chegar como texto mesmo quando o domínio exige número."]},
    {"type":"case_study","title":"Caso: formulário comercial","body":"Um formulário recebe nome, CPF, idade, renda mensal, aceite dos termos e número de parcelas. Classifique o tipo do domínio e o formato provável de chegada pela interface. Marque quais entradas exigem validação e conversão."},
    {"type":"mechanics","title":"Valide na fronteira","items":["Confirme se a entrada está presente quando obrigatória.","Valide o formato antes de converter.","Rejeite valores fora do domínio.","Converta apenas depois de saber o que o dado representa."]},
    {"type":"error_analysis","title":"Por que conversão automática é perigosa","body":"Se `salarioDigitado = \"2500.00\"`, a conversão é plausível. Se vier `\"dois mil\"`, o sistema não deve inventar um valor. Erros de entrada precisam ficar visíveis e tratáveis."},
    {"type":"professional_context","title":"Frontend, API e banco precisam concordar","body":"Quando camadas diferentes atribuem tipos diferentes ao mesmo dado, bugs surgem em cálculos, filtros, relatórios e integrações. A modelagem de tipos é também um contrato entre sistemas."}
  ]$json$::jsonb, estimated_minutes=34, updated_at=now() where module_id=v_module and position=3;

  update nexora.lessons set content=$json$[
    {"type":"workshop","title":"Oficina: transforme uma regra em cálculo verificável","body":"Você vai construir o cálculo de um pedido com quantidade, preço unitário, desconto percentual e frete. O objetivo não é chegar rápido ao resultado; é tornar cada etapa verificável."},
    {"type":"concept","title":"Precedência é parte da semântica","body":"Multiplicação e divisão normalmente acontecem antes de soma e subtração. Parênteses devem refletir a intenção da regra. `(nota1 + nota2) / 2` não é equivalente a `nota1 + nota2 / 2`."},
    {"type":"worked_example","title":"Exemplo completo","body":"3 itens × R$ 20 = subtotal de R$ 60. Desconto de R$ 5 leva a R$ 55. Frete de R$ 12 leva a total de R$ 67. Nomear resultados intermediários permite conferir cada transformação."},
    {"type":"test_design","title":"Projete casos antes de executar","items":["Caso comum: valores diferentes e resultado fácil de prever.","Caso com zero: detecta divisões ou somas indevidas.","Caso com valores iguais: facilita conferir médias.","Caso com decimal: revela arredondamento e representação."]},
    {"type":"practice","title":"Construa e teste","body":"Escreva uma expressão para média de duas notas e uma para desconto de 15%. Antes de executar, registre o resultado esperado para pelo menos três entradas em cada fórmula."},
    {"type":"error_analysis","title":"Uma fórmula pode passar em um teste por coincidência","body":"Testar apenas 8 e 8 não prova que a fórmula da média está correta. Escolha casos que diferenciem expressões concorrentes. O teste deve ser capaz de falhar quando a fórmula estiver errada."},
    {"type":"professional_context","title":"Cálculos de negócio precisam ser auditáveis","body":"Preço, comissão, imposto e desconto são exemplos em que uma expressão compacta demais dificulta revisão. Clareza operacional costuma valer mais que economizar uma linha."}
  ]$json$::jsonb, estimated_minutes=38, updated_at=now() where module_id=v_module and position=4;

  update nexora.lessons set content=$json$[
    {"type":"incident","title":"Incidente: o cliente de 18 anos foi recusado","body":"A regra dizia 'a partir de 18 anos', mas a implementação usava `idade > 18`. Testes com 25 e 30 passaram. O defeito só ficou evidente quando alguém tentou exatamente 18."},
    {"type":"concept","title":"Comparação transforma uma relação em booleano","body":"Operadores como >, >=, <, <= e == respondem verdadeiro ou falso. A escolha correta depende da linguagem da regra, especialmente de como ela trata a fronteira."},
    {"type":"translation","title":"Traduza linguagem de negócio em operador","items":["mais de 18 → > 18","a partir de 18 → >= 18","menos de 500 → < 500","até 500, inclusive → <= 500","exatamente 500 → == 500"]},
    {"type":"test_design","title":"Teste abaixo, no limite e acima","body":"Para `valorPedido >= 300`, use 299, 300 e 301. Esses três valores exercitam a transição da regra e revelam rapidamente se a igualdade foi esquecida."},
    {"type":"case_study","title":"Faixas de comissão","body":"Até R$ 999,99: 2%. De R$ 1.000 a R$ 4.999,99: 4%. A partir de R$ 5.000: 6%. Desenhe os casos de fronteira necessários para provar que não existem lacunas nem sobreposições."},
    {"type":"practice","title":"Crie uma tabela de decisão","body":"Escolha uma regra real com limite. Monte as colunas entrada, esperado e justificativa. Depois altere propositalmente um operador inclusivo para exclusivo e identifique qual teste quebra."},
    {"type":"professional_context","title":"Fronteiras afetam clientes reais","body":"Elegibilidade, crédito, estoque, SLA e descontos frequentemente dependem de limites. Um único símbolo errado pode alterar decisões para milhares de registros."}
  ]$json$::jsonb, estimated_minutes=34, updated_at=now() where module_id=v_module and position=5;

  update nexora.lessons set content=$json$[
    {"type":"problem","title":"Duas condições corretas podem formar uma regra incorreta","body":"Um benefício exige cliente ativo E seis meses de cadastro. Se a solução usar OU, um cliente ativo recém-cadastrado ou um cliente antigo inativo pode ser aprovado indevidamente."},
    {"type":"concept","title":"E, OU e NÃO expressam relações entre booleanos","body":"E exige simultaneidade. OU aceita alternativas. NÃO inverte um estado. A escolha é semântica: o que o requisito realmente exige?"},
    {"type":"case_matrix","title":"Matriz mínima para provar um E","items":["ativo=true, meses=8 → concede","ativo=true, meses=2 → não concede","ativo=false, meses=12 → não concede","ativo=false, meses=2 → não concede"]},
    {"type":"comparison","title":"Agrupamento muda o significado","body":"`(vip || compraAlta) && clienteAtivo` não é a mesma regra que `vip || (compraAlta && clienteAtivo)`. Quando E e OU aparecem juntos, escreva a intenção com nomes intermediários e parênteses explícitos."},
    {"type":"refactor","title":"Dê nome às perguntas da regra","body":"Em vez de uma expressão longa, use `temPerfilElegivel = vip || compraAlta` e depois `podeReceber = temPerfilElegivel && clienteAtivo`. Agora cada parte pode ser testada separadamente."},
    {"type":"practice","title":"Monte quatro cenários que diferenciem E de OU","body":"Crie uma regra de acesso com duas condições. Teste ambos verdadeiros, apenas a primeira verdadeira, apenas a segunda verdadeira e ambos falsos. Registre o resultado esperado antes de escolher o operador."},
    {"type":"professional_context","title":"Lógica composta também é segurança","body":"Autorização e controle de acesso usam as mesmas estruturas booleanas. Trocar E por OU pode deixar de ser um simples erro de negócio e virar exposição indevida de dados ou funções."}
  ]$json$::jsonb, estimated_minutes=36, updated_at=now() where module_id=v_module and position=6;

  update nexora.lessons set content=$json$[
    {"type":"capstone","title":"Desafio de integração: regra comercial completa","body":"Clientes ativos recebem 10% de desconto quando a compra é de R$ 300 ou mais. O valor pode chegar como texto de uma interface. Sua tarefa é modelar dados, validar entrada, aplicar limite, calcular desconto e provar o resultado."},
    {"type":"decomposition","title":"Separe o problema em responsabilidades","items":["Entrada: valor digitado e estado do cliente.","Validação: valor representa número válido?","Configuração: limite e taxa de desconto.","Comparação: atingiu o mínimo?","Lógica: cliente está ativo e atingiu o mínimo?","Cálculo: quanto descontar e qual total final?"]},
    {"type":"worked_example","title":"Uma solução observável","body":"`valorCompra = converter(valorDigitado)`\n`atingiuMinimo = valorCompra >= LIMITE_DESCONTO`\n`elegivel = clienteAtivo && atingiuMinimo`\n`desconto = elegivel ? valorCompra * TAXA_DESCONTO : 0`\n`totalFinal = valorCompra - desconto`"},
    {"type":"test_matrix","title":"Matriz obrigatória","items":["ativo + R$ 299 → sem desconto","ativo + R$ 300 → desconto","ativo + R$ 500 → desconto","inativo + R$ 500 → sem desconto","entrada inválida → erro de validação"]},
    {"type":"error_analysis","title":"O caso feliz não é evidência suficiente","body":"Ativo com R$ 500 passaria em várias implementações erradas. Os casos de R$ 300, cliente inativo e entrada inválida são os que realmente diferenciam soluções."},
    {"type":"refactor","title":"Faça uma segunda versão mais legível","body":"Depois de obter uma solução correta, revise os nomes, a separação de etapas e os testes. Remova duplicação, mas não comprima a regra a ponto de esconder sua intenção."},
    {"type":"professional_context","title":"Esta é a base de regras de negócio reais","body":"Sistemas administrativos, ERPs, CRMs, e-commerce e fintechs combinam exatamente estes elementos: dados, tipos, configuração, cálculo e decisões booleanas."},
    {"type":"self_assessment","title":"Critério de domínio","items":["Consigo explicar cada variável sem olhar a implementação.","Consigo justificar cada constante.","Consigo validar uma entrada antes do cálculo.","Consigo criar testes de fronteira.","Consigo decompor uma condição lógica em perguntas menores.","Consigo prever o resultado antes de executar."]}
  ]$json$::jsonb, estimated_minutes=44, updated_at=now() where module_id=v_module and position=7;

  update nexora.assessments set title='Checkpoint aplicado — Dados e expressões em contexto', max_attempts=3 where course_id=v_course and module_id=v_module;

  insert into nexora.learning_resources(course_id,module_id,title,resource_type,summary,content,position,status)
  select v_course,v_module,'Checklist de revisão — Regra antes do código','checklist','Roteiro de conferência para revisar dados, tipos, cálculos, fronteiras e lógica antes de considerar uma regra pronta.',
  $json${"sections":[{"title":"Dados","items":["Cada variável tem significado claro?","Identificadores foram mantidos como texto?","Entradas externas foram validadas?"]},{"title":"Regra","items":["Limites e taxas estão nomeados?","A precedência representa a intenção?","As fronteiras foram testadas?"]},{"title":"Lógica","items":["E e OU correspondem à linguagem do requisito?","Agrupamentos estão explícitos?","Existem casos em que somente uma condição é verdadeira?"]},{"title":"Evidência","items":["Há resultado esperado antes da execução?","Os testes diferenciam soluções corretas de incorretas?","Uma pessoa externa consegue explicar a regra a partir dos nomes e casos?"]}],"editorial_version":"lc-content-standard-1.0"}$json$::jsonb,5,'published'
  where not exists(select 1 from nexora.learning_resources where module_id=v_module and title='Checklist de revisão — Regra antes do código');
end $$;
