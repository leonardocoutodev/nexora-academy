# LC — Release Readiness

Auditoria e hardening iniciados em 2026-08-29 antes do piloto com alunos reais.

## Produção

- URL oficial: `https://academy.learnandcreate.workers.dev/`.
- Deploy pelo GitHub Actions e Cloudflare Workers Static Assets.
- O build publicado usa o SHA do commit como `LC_BUILD_ID`.
- Production Browser QA valida o mesmo SHA depois do deploy.

## Banco

Em 2026-08-29 o ledger do Supabase foi reconciliado com as migrations de conteúdo já aplicadas ao catálogo:

- 20260828215100
- 20260828215200
- 20260828215300
- 20260828215400
- 20260828215500

Essas versões foram marcadas como aplicadas porque o estado correspondente já estava presente e validado no banco. Elas não foram executadas uma segunda vez.

A migration `20260829115811_lc_audit360_security_performance_hardening.sql` adiciona hardening de snapshots privados, índices, otimizações RLS e rate limiting de analytics.

A migration `20260829120403_lc_public_endpoint_rate_limit_bridge.sql` expõe o limitador somente ao `service_role` para uso pelas Edge Functions.

A migration `20260829120803_lc_admin_manual_pix_reconciliation.sql` adiciona consulta administrativa de contribuições e conciliação manual de Pix direto com auditoria.

## Segurança

- snapshots em `nexora_private` com RLS e privilégios públicos revogados;
- índices adicionados às FKs apontadas pelo Advisor;
- policies críticas usam `(select auth.uid())`;
- rate limiting privado protege ingestão pública de analytics;
- fluxo de contribuição aplica limite de abuso antes de criar preferência;
- webhook Mercado Pago exige assinatura válida;
- funções legadas de doação Nexora devem permanecer desativadas/tombstonadas;
- proteção nativa de senha vazada depende de Supabase Pro; o projeto Free usa requisito LC de senha forte como mitigação de aplicação.

## QA

Cobertura pública inclui homepage, login, cadastro, Apoie, Privacidade, Termos e Certificação. A matriz mobile inclui homepage, login, cadastro e Apoie. O baseline visual inclui homepage e Apoie.

## Próxima validação

Depois do release readiness, a prioridade é piloto com usuários reais e leitura dos dados de ativação, aula, Lab, avaliação, Boss Fight e certificado.
