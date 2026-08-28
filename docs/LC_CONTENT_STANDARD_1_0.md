# LC Content Standard 1.0 — Fase 6

## Objetivo

A Fase 6 transforma a qualidade acadêmica da LC em um sistema verificável. A meta não é aumentar aulas artificialmente, mas garantir que cada unidade gere compreensão, prática, transferência e evidência de aprendizagem.

A referência inicial é o curso **Lógica de Programação Básica**.

## Linha de base do piloto

Auditoria do banco em 28/08/2026:

- 5 módulos;
- 35 aulas publicadas;
- 7 aulas por módulo;
- quase todas as aulas possuem exatamente 7 blocos de conteúdo;
- Módulo 1: média aproximada de 3.184 caracteres por aula;
- Módulo 2: média aproximada de 2.487;
- Módulo 3: média aproximada de 2.281;
- Módulo 4: média aproximada de 2.174;
- Módulo 5: média aproximada de 2.336.

A contagem de caracteres é somente um indicador de diagnóstico. Ela não será utilizada como meta de produção.

### Risco inaugural

A repetição quase universal de sete blocos sugere que parte do conteúdo pode estar obedecendo à interface, em vez de a interface obedecer à necessidade pedagógica. A Fase 6 elimina esse comportamento.

## Critérios de uma aula LC

Uma aula publicada deve responder, de forma clara, às seguintes perguntas:

1. O que o aluno será capaz de fazer ao terminar?
2. Qual problema real torna esse conhecimento útil?
3. Qual conceito ou procedimento precisa ser compreendido?
4. O aluno viu pelo menos uma demonstração ou exemplo concreto?
5. O aluno precisou tomar alguma decisão, resolver algo ou produzir uma resposta?
6. Existe feedback para erro, dúvida ou interpretação comum?
7. A aula se conecta explicitamente à competência anterior e à próxima?
8. O encerramento deixa claro o que foi dominado e o que ainda será desenvolvido?

Nem toda aula precisa usar os mesmos blocos. O desenho depende da competência.

## Tipos de aula

### Conceitual

Usada quando o principal ganho é construir um modelo mental. Pode combinar explicação, analogia, comparação, exemplo e checagem de compreensão.

### Procedimental

Usada quando o aluno precisa aprender uma sequência. Deve incluir demonstração, prática guiada, variação e execução independente.

### Diagnóstica

Usada para detectar conhecimento prévio ou erro conceitual. Deve gerar feedback útil e nunca apenas uma nota.

### Oficina

Usada para combinar competências em uma produção maior. Deve possuir briefing, critérios, restrições, entregável e revisão.

### Estudo de caso

Usado para decisão contextual. Deve apresentar cenário, dados suficientes, alternativas plausíveis e justificativa.

### Revisão

Usada para consolidar retenção. Deve privilegiar recuperação ativa, comparação, aplicação e síntese — não repetir o texto das aulas anteriores.

## Profundidade

A duração e o tamanho são consequência da competência.

Sinais de conteúdo superficial:

- definição sem aplicação;
- exemplo único e óbvio;
- listas de tópicos sem explicação;
- exercício cuja resposta já aparece literalmente acima;
- encerramento que apenas repete a introdução;
- conceitos novos apresentados sem pré-requisito;
- laboratório decorativo;
- exemplos sem contexto profissional ou cotidiano.

Sinais de profundidade adequada:

- múltiplas representações do conceito;
- exemplos progressivos;
- contraste entre solução correta e erro plausível;
- prática com transferência;
- justificativa das decisões;
- feedback específico;
- conexão com situações reais.

## Prática e Labs

Todo Lab precisa ter um objetivo observável.

Deve existir pelo menos um destes níveis:

1. reprodução guiada;
2. adaptação;
3. resolução independente;
4. criação;
5. diagnóstico e correção.

Labs não podem existir apenas para desbloquear o botão de conclusão.

## Checagens inline

Checagens devem avaliar compreensão do ponto recém-ensinado e fornecer feedback local.

Evitar:

- alternativas absurdas;
- perguntas de memorização literal;
- sempre usar a primeira alternativa como correta;
- feedback genérico como "correto" ou "tente novamente".

## Checkpoints e avaliações

Cada avaliação precisa manter rastreabilidade com as competências do módulo.

A avaliação deve medir aplicação, não apenas reconhecimento.

O banco já mantém nota, tentativas e critérios de conclusão; a Fase 6 passa a auditar também a qualidade dos itens.

## Boss Fights

Boss Fight é evidência de competência, não uma atividade extra.

Cada Boss Fight deve conter:

- cenário;
- problema;
- entregável verificável;
- restrições;
- critérios de avaliação;
- nota mínima;
- exemplos do que caracteriza evidência suficiente;
- feedback administrativo acionável.

A aprovação continua vinculada ao fluxo de certificado.

## Certificados

A emissão automática continua dependente das regras acadêmicas.

A partir da Fase 6, administradores podem emitir certificados pelo detalhe do aluno.

Quando o aluno ainda não cumpre os requisitos, a emissão exige:

- ação explícita de override;
- justificativa;
- identificação do administrador;
- persistência no metadata do certificado;
- registro em admin_audit_log.

Uma emissão manual não altera silenciosamente progresso, notas ou Boss Fights.

## Materiais de apoio

Cada módulo deve possuir pelo menos um material que acrescente valor real, como:

- apostila;
- guia de consulta;
- checklist;
- exercício adicional;
- estudo de caso;
- referência externa de alta qualidade.

Material de apoio não deve duplicar integralmente a aula.

## Revisão editorial

Antes de publicação:

- ortografia;
- concordância;
- pontuação;
- terminologia;
- consistência dos exemplos;
- precisão técnica;
- leitura em português brasileiro;
- ausência de frases genéricas repetidas entre aulas.

## Experiência visual

Conteúdo deve ser validado em desktop e mobile.

Diagramas, tabelas e exemplos de código devem caber em 320 px sem perda de informação ou scroll horizontal da página.

## Analytics pedagógico

Após o piloto real, os seguintes sinais devem retroalimentar a revisão:

- abertura da aula;
- conclusão;
- tempo ativo;
- profundidade de scroll;
- erro em checagens inline;
- conclusão de Lab;
- aprovação em quiz;
- submissão e revisão de Boss Fight;
- emissão de certificado.

Baixo tempo não implica automaticamente conteúdo ruim; alto tempo também pode indicar confusão. Os sinais devem ser interpretados em conjunto.

## Gate de publicação

Uma aula só recebe status editorial aprovado quando:

- objetivo está claro;
- pré-requisitos estão coerentes;
- explicação é suficiente para o nível;
- existe aplicação;
- existe verificação de compreensão;
- erros comuns são tratados quando relevantes;
- revisão linguística foi concluída;
- mobile foi verificado;
- conteúdo não é duplicação estrutural ou textual de outra aula.

## Sequência da Fase 6

1. auditar Lógica de Programação Básica;
2. aprofundar e diversificar os módulos 2–5;
3. revisar Labs e checagens;
4. revisar checkpoints;
5. revisar Boss Fights;
6. consolidar apostilas e materiais;
7. executar auditoria editorial completa;
8. validar visualmente desktop/mobile;
9. usar Lógica como baseline para os demais cursos;
10. iniciar piloto real e refinar usando Analytics.
