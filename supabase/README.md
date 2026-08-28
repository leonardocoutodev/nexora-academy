# Supabase da LC

Projeto atual (identificadores técnicos legados preservados por compatibilidade): `kvwsqfnyebyjncfgvqnd`, com dados no schema exposto `nexora` e funções auxiliares no schema privado `nexora_private`.

As migrations anteriores permanecem registradas no projeto remoto. Novas alterações devem ser adicionadas em `supabase/migrations`, revisadas pelos advisors de segurança e desempenho e aplicadas primeiro em uma branch de desenvolvimento.

As Edge Functions versionadas nesta pasta dependem dos secrets gerenciados pelo Supabase: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET` e `NEXORA_ALLOWED_ORIGINS`.

Nunca grave valores desses secrets no GitHub.
