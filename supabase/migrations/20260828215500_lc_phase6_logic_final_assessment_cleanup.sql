-- LC Phase 6 — Logic final assessment residual cleanup
-- Removes the last definition-only questions from the original pilot so the
-- nine-course catalog shares the same applied assessment standard.

update nexora.questions
set prompt='Uma empresa quer calcular 5% de comissão apenas sobre vendas concluídas. Antes de escolher sintaxe ou linguagem, qual especificação reduz mais o risco de implementar a regra errada?',
    options=jsonb_build_array(
      jsonb_build_object('id','a','label','Escolher uma linguagem e começar pelo cálculo de 5%, deixando entradas e exceções para depois.'),
      jsonb_build_object('id','b','label','Criar primeiro a tela que exibirá a comissão e deduzir a regra a partir do resultado visual.'),
      jsonb_build_object('id','c','label','Usar qualquer venda recebida como entrada e corrigir depois os casos que não deveriam gerar comissão.'),
      jsonb_build_object('id','d','label','Definir vendas concluídas como entrada válida, a regra de 5%, a comissão como saída e casos de teste antes da implementação.')
    ),
    feedback_correct='Correto. Programar começa por tornar entrada, regra, saída e critérios de teste explícitos.',
    feedback_incorrect='Ainda não. A linguagem vem depois da especificação verificável do problema.',difficulty=2
where id='c2fbc259-1913-4304-a436-799248d3aa72';

update nexora.questions
set prompt='Um sistema soma valores de pedidos e outro soma horas trabalhadas. Qual decisão demonstra reconhecimento de padrão sem confundir os dois domínios?',
    options=jsonb_build_array(
      jsonb_build_object('id','a','label','Copiar toda a solução de pedidos, incluindo nomes e regras específicas, para o sistema de horas.'),
      jsonb_build_object('id','b','label','Tratar os dois problemas como totalmente diferentes porque os dados representam coisas distintas.'),
      jsonb_build_object('id','c','label','Reconhecer o padrão de percorrer valores e acumular um total, reutilizando a estratégia com nomes e regras adequados a cada domínio.'),
      jsonb_build_object('id','d','label','Somar apenas o primeiro e o último valor, porque isso evita repetir a mesma operação.')
    ),
    feedback_correct='Correto. O padrão reutilizável é a estratégia de percurso e acumulação; o significado dos dados continua pertencendo ao domínio.',
    feedback_incorrect='Ainda não. Reconhecer padrão é reutilizar a estrutura da solução sem apagar as diferenças do problema.',difficulty=2
where id='0bb42107-3e03-4680-a987-f1eb716b5be0';

update nexora.questions
set prompt='Um cadastro recebe CPF "001234", quantidade de itens 3 e clienteAtivo=true. Qual modelagem preserva melhor o significado dos dados?',
    options=jsonb_build_array(
      jsonb_build_object('id','a','label','Converter todos os valores para número para manter um único tipo no programa.'),
      jsonb_build_object('id','b','label','Manter CPF como texto, quantidade como número e clienteAtivo como booleano, usando operações compatíveis com cada tipo.'),
      jsonb_build_object('id','c','label','Guardar todos como texto e fazer conversões apenas quando algum erro aparecer.'),
      jsonb_build_object('id','d','label','Transformar CPF e quantidade em booleanos, pois ambos indicam se existe informação preenchida.')
    ),
    feedback_correct='Correto. O tipo deve representar a natureza do dado e preservar operações e formatação coerentes.',
    feedback_incorrect='Ainda não. Dígitos não tornam automaticamente um dado numérico; considere significado, operações e formatação.',difficulty=2
where id='c4a91ac7-007b-4df4-9d4c-0adb806e674a';

update nexora.questions
set prompt='A regra diz “a partir de 18 anos, acesso permitido”. Qual implementação e conjunto de teste demonstram melhor que a condição está correta?',
    options=jsonb_build_array(
      jsonb_build_object('id','a','label','Usar idade >= 18 e testar 17, 18 e 19 para verificar os dois lados e exatamente a fronteira.'),
      jsonb_build_object('id','b','label','Usar idade > 18 e testar apenas 25, porque valores claramente acima do limite são suficientes.'),
      jsonb_build_object('id','c','label','Usar idade == 18 e testar 18, pois a regra menciona explicitamente essa idade.'),
      jsonb_build_object('id','d','label','Usar idade <= 18 e inverter o resultado na interface quando o usuário reclamar.')
    ),
    feedback_correct='Correto. A condição traduz “a partir de” com >= e os testes pressionam exatamente a fronteira.',
    feedback_incorrect='Ainda não. Traduza a linguagem da regra para o operador correto e teste antes, no limite e depois.',difficulty=2
where id='4e8d81da-e0c7-4531-8c23-c45684774c16';

update nexora.questions
set prompt='Acesso exige conta ativa E e-mail verificado. Qual evidência testa a regra booleana de forma completa?',
    options=jsonb_build_array(
      jsonb_build_object('id','a','label','Testar apenas ativa=true e verificado=true, porque é o único caso que deve liberar.'),
      jsonb_build_object('id','b','label','Testar um caso liberado e assumir que qualquer outro será bloqueado pela implementação.'),
      jsonb_build_object('id','c','label','Testar somente os casos em que conta ativa é true, pois o primeiro requisito já filtra os demais.'),
      jsonb_build_object('id','d','label','Enumerar as quatro combinações de ativa/verificado e confirmar que somente true/true produz “Liberar”.')
    ),
    feedback_correct='Correto. A tabela-verdade cobre todas as combinações e torna o resultado esperado revisável.',
    feedback_incorrect='Ainda não. Para duas condições booleanas, cubra todas as combinações relevantes em vez de testar apenas o caminho feliz.',difficulty=3
where id='cc80841f-35e3-45c3-931f-05e7f7c948a9';

update nexora.questions
set prompt='Você precisa processar cada fatura de uma lista conhecida uma única vez. Qual estrutura expressa melhor essa intenção?',
    options=jsonb_build_array(
      jsonb_build_object('id','a','label','Usar um contador isolado sem percorrer a coleção, incrementando até o total de faturas.'),
      jsonb_build_object('id','b','label','Usar um acumulador como substituto do percurso e adicionar 1 a cada ciclo.'),
      jsonb_build_object('id','c','label','Usar PARA para percorrer a sequência de faturas, tratando o item atual em cada iteração.'),
      jsonb_build_object('id','d','label','Usar ENQUANTO com uma condição que nunca muda, pois a quantidade de faturas já é conhecida.')
    ),
    feedback_correct='Correto. PARA comunica diretamente o percurso de uma sequência conhecida.',
    feedback_incorrect='Ainda não. Escolha a repetição que melhor representa uma sequência conhecida e garanta progresso observável.',difficulty=2
where id='ce84ffb3-dba1-4e13-aebf-d87a384337eb';

update nexora.questions
set prompt='Considere a função calcularFrete(valorPedido, cep) e a chamada calcularFrete(250, "45600-000"). Qual leitura está correta?',
    options=jsonb_build_array(
      jsonb_build_object('id','a','label','250 e "45600-000" são parâmetros; valorPedido e cep são resultados retornados.'),
      jsonb_build_object('id','b','label','valorPedido e cep são parâmetros do contrato da função; 250 e "45600-000" são argumentos fornecidos nessa chamada.'),
      jsonb_build_object('id','c','label','calcularFrete é um argumento e valorPedido é o nome da lista processada pela função.'),
      jsonb_build_object('id','d','label','Parâmetros e argumentos são sempre a mesma coisa e só mudam de nome por estilo.')
    ),
    feedback_correct='Correto. Parâmetros pertencem à definição da função; argumentos são os valores usados em uma chamada concreta.',
    feedback_incorrect='Ainda não. Separe o contrato da função dos valores fornecidos quando ela é chamada.',difficulty=3
where id='2f85db8b-e185-471a-a762-765e8383c855';

update nexora.questions
set prompt='No desafio final de atendimento, qual entrega demonstra melhor domínio integrado de lógica de programação?',
    options=jsonb_build_array(
      jsonb_build_object('id','a','label','Uma solução que valida entradas, aplica regras de prioridade, percorre registros, organiza responsabilidades em funções e apresenta casos de teste reproduzíveis.'),
      jsonb_build_object('id','b','label','Uma única função extensa que produz o resultado esperado para um exemplo, sem registrar casos de fronteira.'),
      jsonb_build_object('id','c','label','Um texto explicando variáveis, condições e laços, sem artefato que possa ser executado ou simulado.'),
      jsonb_build_object('id','d','label','Uma solução que aceita qualquer entrada e corrige manualmente os resultados inesperados depois da execução.')
    ),
    feedback_correct='Correto. O desafio final exige integração dos fundamentos com validação, decomposição e evidência de testes.',
    feedback_incorrect='Ainda não. Domínio integrado precisa aparecer em um artefato verificável e reproduzível, não apenas em definição ou caminho feliz.',difficulty=3
where id='4663ab7d-8265-49a3-90bd-7c252d96061b';
