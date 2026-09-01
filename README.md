# LC — Learn & Create

A **LC — Learn & Create** é uma plataforma gratuita de educação em tecnologia, programação e inteligência artificial, idealizada e desenvolvida por **Leonardo Couto**.

A plataforma foi desenhada para unir conteúdo aprofundado, prática guiada, laboratórios internos, avaliações objetivas, projetos funcionais e materiais de apoio. O acesso acadêmico não depende de pagamento.

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

## Gratuidade e contribuições

Todos os cursos, aulas, laboratórios, avaliações e certificados seguem as mesmas regras para todos. Contribuições são voluntárias e podem ser feitas com **qualquer valor a partir de R$ 1**. Doar não concede vantagem acadêmica.

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
- Alterações de banco ficam versionadas em `supabase/migrations`.
- As Edge Functions versionadas em `supabase/functions` exigem segredos configurados no Supabase; nunca adicione chaves ao repositório.

Variáveis esperadas pelas funções de pagamento:

> Compatibilidade: alguns identificadores técnicos ainda usam o codinome legado `nexora` (schema e alguns aliases de compatibilidade). Eles permanecem somente onde a renomeação poderia interromper sessões, banco ou integrações já existentes.

- `MERCADOPAGO_ACCESS_TOKEN`
- `MERCADOPAGO_WEBHOOK_SECRET`
- `LC_APP_URL` (preferencial; `NEXORA_APP_URL` é aceito apenas como fallback legado)
- `LC_ALLOWED_ORIGINS` (preferencial; `NEXORA_ALLOWED_ORIGINS` permanece como fallback legado)
- `MERCADOPAGO_WEBHOOK_SECRET` (obrigatório para validar a assinatura das notificações LC)

## Política de mudanças

Mudanças relacionadas à mesma evolução de produto devem ser agrupadas em releases coerentes sempre que possível. A documentação descreve o estado atual da plataforma; não é usada como diário de microalterações. Isso mantém o histórico técnico legível sem ocultar a rastreabilidade do Git.


## Limitação conhecida do plano Supabase

O projeto está atualmente no plano Free. A proteção nativa contra senhas vazadas do Supabase (Have I Been Pwned) exige plano Pro ou superior. Enquanto isso, o cadastro LC exige no mínimo 10 caracteres com maiúscula, minúscula, número e símbolo. A ativação da proteção nativa deve ser feita junto com eventual upgrade do projeto.
