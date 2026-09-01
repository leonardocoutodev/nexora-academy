# LC — Learn & Create

[![LC Free](https://img.shields.io/badge/LC_FREE-GRATUITA-2563EB?style=for-the-badge)](https://academy.learnandcreate.workers.dev/?utm_source=github&utm_medium=readme_badge&utm_campaign=lc_divulgacao_2026)
[![Tecnologia](https://img.shields.io/badge/CURSOS-TECNOLOGIA-111827?style=for-the-badge)](https://academy.learnandcreate.workers.dev/?utm_source=github&utm_medium=readme_badge&utm_campaign=lc_divulgacao_2026)
[![Português](https://img.shields.io/badge/IDIOMA-PORTUGUÊS-16A34A?style=for-the-badge)](https://academy.learnandcreate.workers.dev/?utm_source=github&utm_medium=readme_badge&utm_campaign=lc_divulgacao_2026)

> **Comece gratuitamente na LC Free. Formações LC Pro são opcionais.** Acesse agora: [academy.learnandcreate.workers.dev](https://academy.learnandcreate.workers.dev/?utm_source=github&utm_medium=readme_hero&utm_campaign=lc_divulgacao_2026)

A **LC — Learn & Create** é uma plataforma de educação em tecnologia, programação e inteligência artificial com **LC Free** gratuita e formações profissionais opcionais **LC Pro**, idealizada e desenvolvida por **Leonardo Couto**.

A plataforma foi desenhada para unir conteúdo aprofundado, prática guiada, laboratórios internos, avaliações objetivas, projetos funcionais e materiais de apoio. A LC Free não exige pagamento; uma formação LC Pro exige compra para acesso, mas pagamento nunca substitui os critérios acadêmicos de aprovação e certificação.

## Experiência de aprendizagem

- Aulas completas organizadas em etapas digeríveis, sem fragmentação artificial.
- Apostila digital responsiva em cada módulo, com opção de salvar em PDF.
- Laboratórios internos para programação, prompts, planilhas, SQL, APIs, automação e outros formatos práticos.
- Quizzes objetivos com feedback imediato.
- Boss Fights para consolidação e portfólio.
- Trilhas personalizadas, diagnóstico formativo, equivalências, XP, níveis e conquistas.
- Referências técnicas mantidas para transparência editorial.

## Princípios acadêmicos

O conteúdo deve funcionar sozinho dentro da LC. Materiais de apoio aprofundam o aprendizado, mas não substituem aulas completas. Recursos visuais são usados quando explicam um conceito específico; não devem ser repetidos apenas para preencher espaço. A revisão editorial inclui português, clareza, consistência terminológica e correção pedagógica.

## LC Free, LC Pro e contribuições

- **LC Free:** catálogo gratuito, sem assinatura ou cartão obrigatório.
- **LC Pro:** formações profissionais adicionais, vendidas separadamente e protegidas por entitlement + matrícula.
- **Contribuições voluntárias:** podem ser feitas com **qualquer valor a partir de R$ 1** e são independentes das compras LC Pro.

Doar não libera LC Pro e não concede vantagem acadêmica. Comprar uma formação Pro libera acesso somente à formação adquirida; certificado continua condicionado às regras acadêmicas.

## Programa de afiliados LC Pro

O programa possui código individual, atribuição por referência, comissão por produto, bloqueio de autoindicação, maturação de comissão, reversão em reembolso/chargeback e solicitação de saque por Pix. O painel administrativo permite suspender parceiros, definir comissão personalizada e conciliar pagamentos.

A divisão automática via Mercado Pago Marketplace/Split não é presumida: ela depende de habilitação Marketplace e OAuth dos recebedores. Até essa habilitação, o ledger é automático e o repasse é conciliado no admin.

## Autoria e atuação profissional

**Idealizada e desenvolvida por Leonardo Couto.** A LC também funciona como demonstração prática de competências aplicadas em desenvolvimento de plataformas, sistemas, automações, dashboards e soluções digitais vinculadas à atuação profissional de Leonardo Couto / LC Soluções Digitais.

## Stack

- Cloudflare Workers + Static Assets
- Supabase Auth
- Supabase PostgreSQL (`nexora`)
- Supabase Storage

## Produção

URL oficial: `https://academy.learnandcreate.workers.dev/`

## Comece agora

- Plataforma: https://academy.learnandcreate.workers.dev/?utm_source=github&utm_medium=repository&utm_campaign=lc_launch_2026
- Instagram: https://www.instagram.com/learnandcreate_edu/
- Feedback público e lançamento: https://github.com/leonardocoutodev/nexora-academy/issues/45

Se a LC ajudar no seu aprendizado, compartilhe o projeto com outras pessoas que estejam estudando programação, tecnologia ou inteligência artificial.

- [Textos prontos para divulgar a LC em português e inglês](DIVULGUE-A-LC.md)

## Deploy

```bash
npm ci
npm run check
npm run deploy
```

## Desenvolvimento e validação

```bash
npm ci
npm run check
```

O comando `check` executa a auditoria de HTML, JavaScript e links locais, os testes do Worker e uma compilação de validação do Cloudflare Wrangler. O CI do GitHub repete essas verificações em cada push e pull request.

## Segurança e serviços externos

- Os laboratórios JavaScript e TypeScript são executados em um `iframe` isolado. A página principal não usa avaliação dinâmica de código.
- O Worker e os arquivos estáticos enviam cabeçalhos de segurança e políticas de cache.
- Cada deploy publica `LC_BUILD_ID` com o SHA do commit para rastrear Worker e assets da mesma release.
- Analytics público possui allowlist, proteção de propriedades sensíveis e rate limiting por sessão.
- O webhook de contribuição LC valida assinatura do Mercado Pago antes de consultar e atualizar pagamentos.
- O checkout LC Pro cria o pedido no servidor; a liberação de acesso ocorre somente após o webhook validar a assinatura HMAC do Mercado Pago, consultar o pagamento real e conferir referência externa, valor e moeda.
- A atribuição de afiliados é validada novamente no checkout; comissão é registrada de forma idempotente somente após pagamento aprovado e pode ser revertida em reembolso/chargeback.
- Alterações de banco ficam versionadas em `supabase/migrations`.
- As Edge Functions versionadas em `supabase/functions` exigem segredos configurados no Supabase; nunca adicione chaves ao repositório.

Variáveis esperadas pelas funções de pagamento:

> Compatibilidade: alguns identificadores técnicos ainda usam o codinome legado `nexora` (schema e alguns aliases de compatibilidade). Eles permanecem somente onde a renomeação poderia interromper sessões, banco ou integrações já existentes.

- `MERCADOPAGO_ACCESS_TOKEN`
- `MERCADOPAGO_WEBHOOK_SECRET`
- `LC_APP_URL` (preferencial; `NEXORA_APP_URL` é aceito apenas como fallback legado)
- `LC_ALLOWED_ORIGINS` (preferencial; `NEXORA_ALLOWED_ORIGINS` permanece como fallback legado)

## Política de mudanças

Mudanças relacionadas à mesma evolução de produto devem ser agrupadas em releases coerentes sempre que possível. A documentação descreve o estado atual da plataforma; não é usada como diário de microalterações. Isso mantém o histórico técnico legível sem ocultar a rastreabilidade do Git.


## Limitação conhecida do plano Supabase

O projeto está atualmente no plano Free. A proteção nativa contra senhas vazadas do Supabase (Have I Been Pwned) exige plano Pro ou superior. Enquanto isso, o cadastro LC exige no mínimo 10 caracteres com maiúscula, minúscula, número e símbolo. A ativação da proteção nativa deve ser feita junto com eventual upgrade do projeto.
