# LC — Governança do banco Supabase

## Escopo

A LC usa um projeto Supabase que possui histórico compartilhado com outros sistemas. O repositório `nexora-academy` **não é proprietário do histórico global do banco**.

O domínio de dados da LC é:

- schema `nexora`;
- schema privado `nexora_private`;
- funções e objetos auxiliares explicitamente vinculados à LC.

Objetos históricos em `public` e migrations de CRM, Live Connect ou outros produtos não devem ser tratados como parte da LC apenas por existirem no mesmo projeto Supabase.

## Regra operacional obrigatória

Neste repositório é proibido executar:

- `supabase db push`;
- `supabase db reset`;
- `supabase migration up`.

Esses comandos podem interpretar o histórico local como fonte de verdade global e afetar objetos que pertencem a outros sistemas.

A aplicação de banco da LC deve ocorrer de forma explícita e auditável:

1. criar/revisar uma migration SQL limitada ao domínio LC;
2. aplicar a migration específica no projeto Supabase;
3. confirmar o resultado no schema `nexora`/`nexora_private`;
4. registrar a mesma migration no Git;
5. executar `npm run check`;
6. verificar os advisors de segurança/performance quando a mudança alterar RLS, funções, índices ou grants.

## Histórico e timestamps

O banco contém migrations antigas aplicadas em momentos diferentes dos nomes hoje preservados no Git. Não renomeie migrations históricas apenas para fazer timestamps coincidirem. O nome lógico e o estado atual do schema são mais importantes que uma falsa reconstrução do histórico global.

Migrations aplicadas diretamente ao banco que pertençam à LC devem ser recuperadas e versionadas quando identificadas, sem reaplicação automática.

## Segurança

Toda tabela de aplicação da LC deve permanecer com RLS habilitado. Funções `SECURITY DEFINER` devem:

- fixar `search_path`;
- validar `auth.uid()` quando exigirem usuário;
- validar privilégio administrativo em funções `admin_*`;
- conceder `EXECUTE` somente aos papéis que realmente necessitam do RPC.

Tabelas privadas ou de backup podem usar RLS sem policy para produzir comportamento deny-all, desde que não tenham grants diretos indevidos.

## Automação

`npm run db:governance` executa verificações locais e o comando também faz parte de `npm run check` e do CI.

O guard bloqueia:

- comandos destrutivos globais do Supabase em scripts/workflows;
- timestamps duplicados de migrations;
- operações destrutivas contra o schema global `public`;
- manipulação direta do histórico `supabase_migrations`.

Essa proteção não substitui revisão humana da SQL, mas impede regressões operacionais óbvias.
