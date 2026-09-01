# Supabase da LC

Este diretório contém somente artefatos de banco e Edge Functions usados pela LC — Learn & Create.

**Atenção:** o projeto Supabase conectado possui histórico compartilhado com outros sistemas. Este repositório controla o domínio `nexora`/`nexora_private`, não o banco inteiro.

Não use comandos de sincronização global como `supabase db push`, `supabase db reset` ou `supabase migration up`.

Para alterações de schema:

1. escreva uma migration específica;
2. revise o escopo;
3. aplique somente essa migration de forma controlada;
4. valide RLS, grants, funções e advisors;
5. mantenha o arquivo versionado aqui.

Leia `../docs/LC_DATABASE_GOVERNANCE.md`.
