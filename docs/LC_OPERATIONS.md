# LC Operations Center — Fase 3

A Central Operacional é a interface administrativa da LC para acompanhamento acadêmico e ações de rotina.

## Princípios

- O frontend não recebe acesso irrestrito às tabelas sensíveis.
- Leituras administrativas usam RPCs `SECURITY DEFINER` com verificação explícita de `nexora_private.is_admin()`.
- Mudanças administrativas relevantes são registradas em `nexora.admin_audit_log`.
- O aluno pode editar somente campos pessoais permitidos; `role` e `status` não são atualizáveis pelo papel `authenticated`.
- Cancelamento de matrícula é preferido a exclusão física para preservar histórico.

## Áreas da central

### Visão geral
Exibe:
- alunos;
- alunos ativos;
- matrículas ativas;
- aulas concluídas;
- Boss Fights pendentes;
- certificados;
- alertas operacionais.

### Alunos
Permite:
- pesquisa por nome ou e-mail;
- filtro por status;
- filtro por curso;
- visualização de progresso por curso;
- histórico de avaliações;
- histórico de Boss Fights;
- certificados;
- alteração administrativa de status e papel;
- ativação e alteração de status de matrícula.

### Boss Fights
Permite:
- filtrar por status e curso;
- abrir a entrega;
- consultar rubrica;
- atribuir nota;
- registrar feedback;
- aprovar;
- solicitar ajustes.

A revisão usa `review_project_submission`. Aprovações continuam integradas ao trigger existente de XP.

### Certificados
Permite:
- pesquisa por aluno, e-mail ou código;
- filtro por curso;
- acesso à verificação pública.

### Auditoria
Registra:
- alteração de perfil;
- alteração de matrícula;
- ativação de matrícula;
- revisão de Boss Fight.

## RPCs administrativas

- `admin_operational_summary()`
- `admin_student_roster(search,status,course_id)`
- `admin_student_detail(user_id)`
- `admin_update_profile(user_id,status,role)`
- `admin_update_enrollment(enrollment_id,status)`
- `admin_create_enrollment(user_id,course_id)`
- `admin_boss_roster(status,course_id)`
- `admin_certificate_roster(search,course_id)`
- `admin_audit_feed(limit)`

## Segurança de perfil

O papel `authenticated` possui UPDATE apenas nas colunas:

- `full_name`
- `avatar_path`
- `updated_at`

Não possui UPDATE em:

- `role`
- `status`

Mudanças de acesso passam exclusivamente pelas RPCs administrativas.

## Política operacional

Ações destrutivas devem ser raras. A interface usa estados como `inactive`, `blocked`, `paused` e `cancelled` para manter histórico e rastreabilidade.
