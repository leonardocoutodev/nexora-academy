-- LC Programador Master — estrutura inicial baseada no currículo Programador Master da Ouro Moderno,
-- reorganizada e modernizada para a metodologia LC. Conteúdo autoral será produzido em migrations posteriores.
begin;

insert into nexora.courses(
  slug,title,description,status,minimum_score,position,
  course_type,level_label,category_label,is_recommended_start,recommendation_note
)
values(
  'programador-master',
  'Programador Master',
  'Formação prática em programação do zero ao projeto publicado, cobrindo lógica, Git, HTML e CSS, JavaScript, PHP e MySQL, WordPress, Python, Java, APIs e integração full stack.',
  'draft',70,23,
  'formation','Profissional','Programação',false,
  'Recomendado após concluir a base de lógica ou demonstrar domínio equivalente no diagnóstico.'
)
on conflict(slug) do update set
  title=excluded.title,
  description=excluded.description,
  minimum_score=excluded.minimum_score,
  position=excluded.position,
  course_type=excluded.course_type,
  level_label=excluded.level_label,
  category_label=excluded.category_label,
  is_recommended_start=excluded.is_recommended_start,
  recommendation_note=excluded.recommendation_note,
  updated_at=now();

with course as (
  select id from nexora.courses where slug='programador-master'
), module_data as (
  select *
  from jsonb_to_recordset('[{"pos":1,"title":"Lógica de Programação e Algoritmos","desc":"Base de raciocínio para transformar problemas em algoritmos verificáveis antes de escolher uma linguagem."},{"pos":2,"title":"Ambiente, Terminal, Git e GitHub","desc":"Fluxo profissional de desenvolvimento: arquivos, terminal, controle de versão, commits, branches e publicação de código."},{"pos":3,"title":"HTML5 e CSS3","desc":"Estrutura semântica, layout responsivo, acessibilidade e construção de interfaces web modernas."},{"pos":4,"title":"JavaScript para Web","desc":"Programação no navegador: dados, funções, DOM, eventos, formulários, armazenamento e consumo de APIs."},{"pos":5,"title":"PHP e MySQL","desc":"Backend web com PHP, persistência relacional, CRUD, validação, sessões e segurança básica."},{"pos":6,"title":"WordPress Profissional","desc":"Criação, configuração, personalização, desempenho, segurança e publicação de sites em WordPress."},{"pos":7,"title":"Python","desc":"Programação em Python com foco em fundamentos, estruturas de dados, funções, arquivos, automação e APIs."},{"pos":8,"title":"Java","desc":"Fundamentos de Java e orientação a objetos, coleções, exceções e construção de aplicações organizadas."},{"pos":9,"title":"APIs, Integrações e Projeto Final","desc":"Integração entre frontend, backend e serviços externos, testes, deploy e entrega de um projeto de portfólio."}]'::jsonb)
    as x(pos integer,title text,description text)
)
insert into nexora.modules(course_id,title,description,position)
select course.id,module_data.title,module_data.description,module_data.pos
from course cross join module_data
on conflict(course_id,position) do update set
  title=excluded.title,
  description=excluded.description;

with course as (
  select id from nexora.courses where slug='programador-master'
), ordered as (
  select m.id,m.position,lag(m.id) over(order by m.position) previous_id
  from nexora.modules m join course c on c.id=m.course_id
)
update nexora.modules m
set prerequisite_module_id=o.previous_id
from ordered o
where m.id=o.id
  and m.prerequisite_module_id is distinct from o.previous_id;

with lesson_data(module_position,lesson_position,title) as (
  values
  (1,1,'O que significa programar'),
  (1,2,'Problema, entrada, processamento e saída'),
  (1,3,'Algoritmos e critérios de qualidade'),
  (1,4,'Variáveis, constantes e tipos de dados'),
  (1,5,'Operadores e expressões'),
  (1,6,'Decisões com condições'),
  (1,7,'Repetições e controle de fluxo'),
  (1,8,'Funções e decomposição'),
  (1,9,'Listas e estruturas de dados'),
  (1,10,'Teste de mesa, casos-limite e depuração'),
  (1,11,'Do pseudocódigo ao código'),
  (1,12,'Desafio integrador de lógica'),
  (2,1,'Como funciona um ambiente de desenvolvimento'),
  (2,2,'Terminal, pastas e caminhos'),
  (2,3,'Comandos essenciais para trabalhar com projetos'),
  (2,4,'Git: repositório, status e histórico'),
  (2,5,'Staging, commits e mensagens úteis'),
  (2,6,'Branches, merge e resolução de conflitos'),
  (2,7,'GitHub, remoto, push e pull'),
  (2,8,'README, versionamento e publicação de projeto'),
  (3,1,'Introdução ao HTML e estrutura básica'),
  (3,2,'Tags e elementos HTML fundamentais'),
  (3,3,'Links, imagens, listas e conteúdo semântico'),
  (3,4,'Formulários e elementos interativos'),
  (3,5,'HTML semântico e acessibilidade'),
  (3,6,'Introdução ao CSS: seletores e cascata'),
  (3,7,'Box model e fluxo de layout'),
  (3,8,'Cores, tipografia e espaçamento'),
  (3,9,'Flexbox'),
  (3,10,'CSS Grid'),
  (3,11,'Posicionamento e camadas'),
  (3,12,'Responsividade e media queries'),
  (3,13,'Transições e animações com propósito'),
  (3,14,'Organização de CSS e componentes'),
  (3,15,'Projeto: landing page responsiva'),
  (4,1,'JavaScript e o papel da linguagem na Web'),
  (4,2,'Variáveis, tipos e coerção'),
  (4,3,'Operadores e expressões em JavaScript'),
  (4,4,'Condições e repetição'),
  (4,5,'Funções, escopo e retorno'),
  (4,6,'Arrays e objetos'),
  (4,7,'Métodos de coleção'),
  (4,8,'DOM: selecionar e alterar a página'),
  (4,9,'Eventos e interação do usuário'),
  (4,10,'Formulários e validação'),
  (4,11,'LocalStorage e estado simples'),
  (4,12,'JSON e requisições HTTP'),
  (4,13,'Fetch e consumo de APIs'),
  (4,14,'Projeto: aplicação web interativa'),
  (5,1,'Como funciona uma aplicação PHP'),
  (5,2,'Sintaxe, variáveis e tipos em PHP'),
  (5,3,'Operadores, condições e laços'),
  (5,4,'Funções e organização de código'),
  (5,5,'Arrays e manipulação de dados'),
  (5,6,'Requisições GET e POST'),
  (5,7,'Formulários e validação no servidor'),
  (5,8,'Introdução a bancos de dados relacionais'),
  (5,9,'Modelagem de tabelas e relacionamentos'),
  (5,10,'SQL: SELECT, INSERT, UPDATE e DELETE'),
  (5,11,'PHP com MySQL usando PDO'),
  (5,12,'CRUD completo'),
  (5,13,'Sessões e autenticação'),
  (5,14,'Segurança: validação, escaping e SQL injection'),
  (5,15,'Organização em camadas e reutilização'),
  (5,16,'Projeto: sistema web com banco de dados'),
  (6,1,'WordPress: arquitetura e casos de uso'),
  (6,2,'Instalação e configuração inicial'),
  (6,3,'Painel, usuários e permissões'),
  (6,4,'Páginas, posts, categorias e mídia'),
  (6,5,'Temas e personalização'),
  (6,6,'Menus, widgets e blocos'),
  (6,7,'Plugins e critérios de escolha'),
  (6,8,'Formulários e captação de dados'),
  (6,9,'SEO técnico básico'),
  (6,10,'Desempenho, cache e imagens'),
  (6,11,'Segurança, backup e atualizações'),
  (6,12,'Projeto: site profissional publicado'),
  (7,1,'Python e o interpretador'),
  (7,2,'Variáveis, tipos e entrada de dados'),
  (7,3,'Condições em Python'),
  (7,4,'Laços for e while'),
  (7,5,'Funções e retorno'),
  (7,6,'Listas e tuplas'),
  (7,7,'Dicionários e conjuntos'),
  (7,8,'Strings e manipulação de texto'),
  (7,9,'Arquivos e caminhos'),
  (7,10,'Tratamento de erros'),
  (7,11,'Módulos, pacotes e ambiente virtual'),
  (7,12,'Automação de tarefas'),
  (7,13,'Consumo de APIs com Python'),
  (7,14,'Projeto: automação útil do mundo real'),
  (8,1,'Java e a JVM'),
  (8,2,'Primeiro programa e estrutura de projeto'),
  (8,3,'Variáveis, tipos e operadores'),
  (8,4,'Condições e repetição'),
  (8,5,'Métodos e parâmetros'),
  (8,6,'Classes e objetos'),
  (8,7,'Construtores e encapsulamento'),
  (8,8,'Herança e composição'),
  (8,9,'Polimorfismo e interfaces'),
  (8,10,'Collections: List, Set e Map'),
  (8,11,'Exceções e tratamento de erros'),
  (8,12,'Entrada, saída e arquivos'),
  (8,13,'Organização em pacotes e boas práticas'),
  (8,14,'Projeto: aplicação Java orientada a objetos'),
  (9,1,'Arquitetura cliente, servidor e API'),
  (9,2,'HTTP, métodos, status e headers'),
  (9,3,'REST e desenho de endpoints'),
  (9,4,'Autenticação e autorização em APIs'),
  (9,5,'Consumindo APIs no frontend'),
  (9,6,'Integrando frontend e backend'),
  (9,7,'Variáveis de ambiente e secrets'),
  (9,8,'Testes essenciais antes de publicar'),
  (9,9,'Deploy de frontend e backend'),
  (9,10,'Observabilidade e diagnóstico de erros'),
  (9,11,'Projeto final: planejamento e critérios de sucesso'),
  (9,12,'Projeto final: construir, testar, publicar e apresentar')
), target as (
  select m.id module_id,d.lesson_position,d.title
  from lesson_data d
  join nexora.courses c on c.slug='programador-master'
  join nexora.modules m on m.course_id=c.id and m.position=d.module_position
)
insert into nexora.lessons(module_id,title,position,status,content)
select module_id,title,lesson_position,'draft','[]'::jsonb
from target
on conflict(module_id,position) do update set
  title=excluded.title,
  status='draft';

insert into nexora.course_completion_rules(
  course_id,minimum_lesson_progress,minimum_assessment_score,
  require_all_module_assessments,require_final_assessment,require_final_project,
  minimum_project_score,certificate_enabled,updated_at
)
select id,100,70,true,true,true,70,false,now()
from nexora.courses
where slug='programador-master'
on conflict(course_id) do update set
  minimum_lesson_progress=excluded.minimum_lesson_progress,
  minimum_assessment_score=excluded.minimum_assessment_score,
  require_all_module_assessments=excluded.require_all_module_assessments,
  require_final_assessment=excluded.require_final_assessment,
  require_final_project=excluded.require_final_project,
  minimum_project_score=excluded.minimum_project_score,
  certificate_enabled=false,
  updated_at=now();

commit;
