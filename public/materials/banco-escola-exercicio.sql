-- NEXORA ACADEMY — EXERCÍCIO DE BANCO DE DADOS
-- Objetivo: praticar CREATE TABLE, PK, FK, INSERT, SELECT, JOIN e GROUP BY.

create table alunos (
  id integer primary key,
  nome text not null,
  cidade text not null
);

create table cursos (
  id integer primary key,
  titulo text not null,
  categoria text not null
);

create table matriculas (
  id integer primary key,
  aluno_id integer not null references alunos(id),
  curso_id integer not null references cursos(id),
  data_matricula date not null
);

insert into alunos values
(1,'Ana','Ilhéus'),
(2,'Bruno','Itabuna'),
(3,'Carla','Ilhéus');

insert into cursos values
(1,'IA Generativa','Tecnologia'),
(2,'Desenvolvimento Web','Tecnologia');

insert into matriculas values
(1,1,1,'2026-08-01'),
(2,2,2,'2026-08-02'),
(3,3,1,'2026-08-03'),
(4,1,2,'2026-08-04');

-- DESAFIO 1: liste aluno + curso usando JOIN.
-- DESAFIO 2: conte matrículas por curso com GROUP BY.
-- DESAFIO 3: filtre apenas alunos de Ilhéus.
-- DESAFIO 4: explique por que matriculas precisa de duas FKs.
