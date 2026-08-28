# LC UI Foundation 1.0

Base visual canônica da LC a partir de 2026-08-28.

## Objetivo

A interface não deve evoluir por sobreposição indefinida de patches CSS. Mudanças novas devem alterar o componente responsável ou criar um componente claramente delimitado.

## Arquitetura CSS

- `styles.css`: reset, tokens globais, shell, formulários e primitivas.
- `academy-v3.css`: componentes da aplicação e responsividade. O nome do arquivo é mantido apenas por compatibilidade.
- `learning-release.css`: experiência de aula contínua e seus componentes específicos.
- `lc-brand.css`: tokens oficiais da identidade LC.

Não criar uma nova camada de override global para resolver conflito entre arquivos existentes.

## Breakpoints canônicos

A aplicação usa somente:

- 1100px — layouts largos;
- 900px — grids e composições intermediárias;
- 820px — transição oficial desktop → mobile;
- 620px — mobile estreito / grids simples;
- 420px — telefones compactos.

Exceções permitidas: media queries de altura, impressão e preferências de movimento.

## Cascata

Orçamento automatizado de `!important`:

- `academy-v3.css`: máximo 12;
- `learning-release.css`: máximo 3;
- `styles.css`: máximo 8.

O objetivo não é usar o orçamento inteiro. `!important` só é aceito em casos estruturais como impressão, estado `hidden` ou proteção de acessibilidade.

## Componentes

### Marca
- LC Mark sozinho em áreas compactas/mobile.
- LC Mark + Learn & Create em contextos horizontais.
- Não recriar o monograma por CSS ou texto.

### Ícones
- família única SVG outline;
- stroke 1.8–2px;
- cantos arredondados;
- `currentColor`;
- tamanho padrão 20px;
- emojis não são ícones de navegação.

### Cards
- raio 14–18px;
- bordas sutis;
- sombra curta;
- sem hover com deslocamento em touch/mobile.

### Botões
- primário: LC Blue;
- sucesso: LC Mint;
- erro: LC Error;
- mínimo 44px desktop / 48px mobile.

## Aula

A experiência de aula é contínua.

- sem paginação horizontal;
- sem CSS `.nx-book*`;
- largura de leitura limitada;
- hierarquia por tipografia e separadores, não por um card em cada bloco;
- Conteúdo / Prática / Resumo como navegação contextual;
- materiais em bottom sheet;
- sidebar de aulas somente em desktop;
- mobile usa cabeçalho compacto e sheets.

## Mobile

- safe areas obrigatórias;
- navegação inferior com 5 slots;
- teclado pode ocultar a navegação inferior;
- inputs textuais usam 16px para evitar zoom involuntário;
- todos os alvos principais têm aproximadamente 48px;
- sem transform de hover em touch.

## Política de manutenção

Uma correção visual só deve entrar se:

1. identifica o componente responsável;
2. altera a regra canônica;
3. não adiciona novo breakpoint fora da escala;
4. não aumenta o orçamento de `!important` sem justificativa;
5. mantém `npm run check` verde.

Se um problema exigir várias exceções locais, o componente deve ser refatorado em vez de receber mais overrides.
