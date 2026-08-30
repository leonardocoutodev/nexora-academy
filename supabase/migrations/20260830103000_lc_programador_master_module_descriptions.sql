-- Correct module descriptions for the Programador Master draft.
begin;
with data(position,description) as (
  values
  (1,'Base de raciocínio para transformar problemas em algoritmos verificáveis antes de escolher uma linguagem.'),
  (2,'Fluxo profissional de desenvolvimento: arquivos, terminal, controle de versão, commits, branches e publicação de código.'),
  (3,'Estrutura semântica, layout responsivo, acessibilidade e construção de interfaces web modernas.'),
  (4,'Programação no navegador: dados, funções, DOM, eventos, formulários, armazenamento e consumo de APIs.'),
  (5,'Backend web com PHP, persistência relacional, CRUD, validação, sessões e segurança básica.'),
  (6,'Criação, configuração, personalização, desempenho, segurança e publicação de sites em WordPress.'),
  (7,'Programação em Python com foco em fundamentos, estruturas de dados, funções, arquivos, automação e APIs.'),
  (8,'Fundamentos de Java e orientação a objetos, coleções, exceções e construção de aplicações organizadas.'),
  (9,'Integração entre frontend, backend e serviços externos, testes, deploy e entrega de um projeto de portfólio.')
)
update nexora.modules m
set description=data.description
from nexora.courses c,data
where c.slug='programador-master'
  and m.course_id=c.id
  and m.position=data.position;
commit;
