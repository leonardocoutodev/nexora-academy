# LC Quality Engineering — Fase 5

A Fase 5 transforma qualidade em uma etapa contínua de engenharia da LC. O objetivo não é apenas detectar bugs antes do deploy, mas impedir regressões funcionais, visuais, responsivas, de acessibilidade e performance.

## Camadas de qualidade

### 1. Contratos estáticos
Executados por `scripts/quality-static.mjs`.

Validam:
- `lang="pt-BR"`;
- viewport configurado;
- IDs duplicados no HTML estático;
- imagens com `alt`;
- breakpoint mobile principal;
- orçamento de `!important`.

O analisador ignora HTML gerado dentro de scripts; DOM dinâmico é validado no navegador real.

### 2. E2E em navegador
Playwright executa fluxos de usuário em Chromium.

Fluxos protegidos:
- rotas públicas;
- mapa de curso;
- aula contínua;
- Lab;
- conclusão de aula;
- checagem inline;
- quiz;
- Boss Fight;
- certificado;
- central administrativa;
- detalhe acadêmico de aluno;
- avaliação de Boss Fight;
- Analytics.

As APIs Supabase dos testes autenticados são interceptadas por mocks determinísticos. Nenhuma conta real de QA precisa ser criada e os testes não alteram dados acadêmicos reais.

### 3. Compatibilidade
Smokes marcados com `@compat` são executados em:
- Chromium;
- Firefox;
- WebKit.

O objetivo é detectar diferenças de engine em navegação e renderização essencial sem triplicar toda a suíte funcional.

### 4. Mobile
A matriz oficial da LC é:
- 320 px;
- 360 px;
- 375 px;
- 390 px;
- 412 px;
- 430 px.

Para cada largura, a suíte verifica curso, aula e admin.

Critérios:
- sem overflow horizontal da página;
- bottom navigation contida no viewport;
- principais alvos interativos com dimensão mínima aproximada de 44 px;
- screenshot full-page anexado como evidência.

### 5. Acessibilidade
Axe é executado em superfícies públicas, aprendizagem e administração.

O CI falha para violações:
- serious;
- critical.

Além disso, componentes interativos devem possuir nome acessível, semântica adequada, foco utilizável e contraste suficiente.

### 6. Performance
Lighthouse CI mede home, login e cadastro.

Budgets atuais:
- Performance >= 75;
- Accessibility >= 95;
- Best Practices >= 90;
- SEO >= 90;
- CLS <= 0.12;
- LCP <= 4500 ms;
- TBT <= 500 ms.

Esses valores são gates mínimos, não metas de excelência. O objetivo é apertá-los conforme a plataforma estabilizar.

### 7. Regressão visual
Playwright mantém casos visuais de referência para:
- login desktop;
- curso mobile 390 px;
- aula mobile 390 px;
- admin desktop.

A primeira execução aprovada na `main` gera a baseline. Pull requests futuros restauram a baseline mais recente e comparam screenshots automaticamente.

Tolerância inicial:
- `maxDiffPixelRatio = 0.015`.

Uma diferença visual acima da tolerância bloqueia o gate até que:
1. seja corrigida; ou
2. seja aprovada conscientemente por merge na `main`, que gera a nova baseline.

### 8. Produção
Depois de `Deploy Production` concluir com sucesso, `Production Browser QA`:
1. confirma o BUILD_ID publicado;
2. abre o Worker de produção em Chromium;
3. executa smokes `@compat` contra os assets efetivamente publicados.

Fluxos autenticados continuam usando backend mockado no navegador para não contaminar dados reais.

## Evidências
GitHub Actions preserva por 14 dias:
- Playwright HTML report;
- screenshots;
- vídeos de falha;
- traces;
- Lighthouse reports.

## Política de falhas
Um gate vermelho não deve ser contornado reduzindo arbitrariamente o teste.

Classificação:
1. bug real do produto → corrigir o produto;
2. problema real de acessibilidade/performance → corrigir o produto;
3. expectativa de teste errada → corrigir o teste;
4. instabilidade do ambiente → estabilizar o ambiente;
5. alteração visual intencional → aprovar nova baseline somente após revisão.

## Achados inaugurais da Fase 5
A implantação dos gates já encontrou e levou à correção de:
- semântica ARIA incorreta no progresso de leitura;
- contraste insuficiente em opções de Labs;
- select do Analytics sem nome acessível;
- tabs administrativas abaixo do tamanho recomendado de toque;
- CLS do login acima do budget;
- falsos positivos do analisador estático em strings JavaScript.

Esses achados demonstram que os gates devem permanecer como parte permanente do fluxo de desenvolvimento da LC.
