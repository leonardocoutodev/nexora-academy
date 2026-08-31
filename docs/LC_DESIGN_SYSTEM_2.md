# LC Design System 2.0

Data: 2026-08-31  
Produto: LC — Learn & Create

## Objetivo

Modernizar a experiência visual da plataforma sem alterar regras acadêmicas, dados ou fluxos essenciais.

## Regra estrutural

A plataforma passa a usar **uma única folha visual canônica**:

`public/assets/css/lc.css`

Foram removidos:

- `styles.css`
- `academy-v3.css`
- `learning-release.css`
- `lc-brand.css`

O conteúdo ainda necessário desses arquivos foi consolidado em `lc.css`. Não deve ser criada nova folha global concorrente. Novas evoluções visuais devem entrar no sistema canônico.

## Direção de design

- dark mode premium e discreto;
- azul elétrico e mint como acentos, não como decoração excessiva;
- menos caixas e bordas;
- mais hierarquia editorial;
- tipografia mais protagonista;
- superfícies com profundidade suave;
- cards reservados para agrupamentos e ações relevantes;
- experiência mobile com comportamento de app;
- Admin com maior densidade informacional;
- Labs com aparência própria de ferramenta;
- Boss Fights com presença visual de entrega profissional.

## Tokens principais

O Design System 2.0 centraliza:

- cores de fundo, superfície, texto e estados;
- raios;
- sombras;
- espaçamentos;
- largura do shell e sidebar;
- easing de interação;
- tipografia e escala;
- breakpoints.

## Superfícies migradas

- Home pública
- Login / Cadastro
- Apoie
- Dashboard
- Comece aqui
- Cursos
- Curso
- Aula
- Quiz
- Projetos / Boss Fights
- Biblioteca
- Apostila
- Certificados
- Perfil
- Admin
- Certificação pública
- Verificação de certificado
- Checkout legado informativo
- Privacidade / Termos

## Compatibilidade

Os nomes de classes existentes foram preservados para não quebrar JavaScript e fluxos acadêmicos. A modernização atua sobre o renderer existente, não cria uma segunda interface paralela.

## Regra futura

Não adicionar `academy-v4.css`, `release-fixes.css` ou arquivos equivalentes. Se uma necessidade for global, deve ser incorporada a `lc.css`. Se for específica de um artefato isolado (por exemplo, documento imprimível), deve permanecer local e não competir com o Design System da aplicação.
