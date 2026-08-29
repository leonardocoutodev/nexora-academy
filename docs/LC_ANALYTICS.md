# LC Analytics — Fase 4

Camada de analytics de produto e aprendizagem da LC.

## Objetivo

Responder, com dados observáveis:

- quantas pessoas iniciam cadastro;
- quantas chegam ao diagnóstico;
- quais objetivos escolhem;
- quais cursos são abertos;
- quais aulas são abertas e concluídas;
- quanto tempo ativo o aluno passa em uma aula;
- qual profundidade média de leitura;
- onde checagens inline apresentam dificuldade;
- quais Labs são concluídos;
- desempenho em quizzes;
- envio de Boss Fights;
- emissão de certificados;
- uso mobile/tablet/desktop.

## Privacidade por desenho

A tabela de eventos não armazena:

- senha;
- conteúdo digitado pelo aluno;
- respostas livres;
- texto das entregas;
- endereço IP;
- user-agent bruto;
- e-mail ou nome dentro das propriedades do evento.

Os dados de identificação acadêmica permanecem nas tabelas de domínio já protegidas. O evento guarda apenas `user_id` quando autenticado.

O dispositivo é classificado apenas como:

- mobile;
- tablet;
- desktop;
- unknown.

O viewport é salvo como largura e altura numéricas.

## Sessões

O cliente cria um identificador aleatório local.

Uma sessão expira após 30 minutos sem atividade. Eventos anônimos de início de cadastro podem ser associados ao usuário autenticado depois do login por `identify_analytics_session`, limitado aos últimos 7 dias.

## Eventos

Eventos aceitos pelo backend:

- `signup_started`
- `signup_completed`
- `login_completed`
- `app_session_started`
- `goal_selected`
- `diagnostic_started`
- `diagnostic_completed`
- `route_recommended`
- `course_opened`
- `lesson_opened`
- `lesson_engagement`
- `lesson_completed`
- `inline_check_answered`
- `lab_opened`
- `lab_completed`
- `quiz_started`
- `quiz_completed`
- `boss_page_viewed`
- `boss_submitted`
- `boss_resubmitted`
- `certificate_page_viewed`
- `certificate_issued`
- `support_page_viewed`
- `support_cta_clicked`
- `donation_started`
- `donation_checkout_opened`
- `donation_returned`

O backend rejeita nomes fora da allowlist e limita propriedades a 4 KB.

## Engajamento de aula

`lesson_engagement` mede:

- `duration_seconds`: tempo ativo com a página visível, limitado a 30 minutos por carga de página;
- `max_scroll_percent`: maior profundidade de scroll atingida.

A métrica representa atenção ativa aproximada, não “tempo estudando” com precisão absoluta.

## Painel administrativo

A aba Analytics da Central Operacional possui:

### Visão
- usuários ativos;
- sessões;
- aulas abertas;
- aulas concluídas;
- engajamento médio;
- aprovação em quiz;
- participação mobile;
- total de eventos.

### Jornada
Etapas observadas:
1. cadastro iniciado;
2. acesso autenticado;
3. diagnóstico concluído;
4. curso aberto;
5. aula aberta;
6. aula concluída;
7. Boss Fight enviada;
8. certificado emitido.

A leitura é de alcance por etapa dentro da janela selecionada. Não deve ser interpretada como coorte estrita quando usuários antigos entram no produto durante o período.

### Cursos
Combina analytics de evento com tabelas acadêmicas para mostrar:
- matrículas;
- alunos ativos;
- aberturas;
- conclusões;
- média e aprovação de quiz;
- Boss Fights;
- certificados;
- engajamento.

### Aulas
Por curso:
- aberturas;
- usuários únicos;
- conclusões;
- taxa conclusão/abertura;
- tempo ativo médio;
- scroll médio;
- checagens inline;
- taxa de acerto inline;
- Labs concluídos.

### Dispositivos
Distribuição de sessões por mobile, tablet e desktop.

### Objetivos
Usa `user_learning_preferences` para mostrar intenção declarada e diagnóstico.

## Segurança

A tabela `nexora.product_events` não é acessível diretamente por `anon` ou `authenticated`.

Escrita ocorre apenas por:

- `track_product_event`

Leitura agregada ocorre apenas por RPCs administrativas protegidas por `nexora_private.is_admin()`.

O papel anônimo possui `USAGE` no schema exclusivamente para alcançar funções com EXECUTE explicitamente concedido. Nenhuma tabela educacional foi liberada para leitura ou escrita anônima.

## RPCs de analytics

- `track_product_event`
- `identify_analytics_session`
- `admin_analytics_overview`
- `admin_analytics_funnel`
- `admin_analytics_daily`
- `admin_analytics_courses`
- `admin_analytics_lessons`
- `admin_analytics_devices`
- `admin_analytics_goals`

## Interpretação

Analytics deve orientar investigação, não substituir julgamento pedagógico.

Exemplos:

- muito `lesson_opened` e pouco `lesson_completed` → revisar clareza, duração, bug ou dificuldade;
- scroll baixo + tempo curto → introdução pode não estar retendo;
- scroll alto + conclusão baixa → bloqueio pode estar no Lab/CTA final;
- muitos erros inline numa aula → explicação anterior pode estar insuficiente;
- bom quiz + baixo Lab → conhecimento reconhecido sem aplicação prática;
- alto abandono concentrado no mobile → investigar UX/responsividade antes de conteúdo.


## Funil de apoio

A jornada pública de contribuição é observada sem registrar nome, e-mail ou outros dados pessoais nas propriedades de analytics:

1. `support_page_viewed`;
2. `support_cta_clicked`;
3. `donation_started`;
4. `donation_checkout_opened`;
5. `donation_returned`.

O status de retorno pode indicar `success`, `pending` ou `failure`. Confirmação financeira definitiva continua sendo responsabilidade do webhook e das tabelas de doações, não do evento de frontend.
