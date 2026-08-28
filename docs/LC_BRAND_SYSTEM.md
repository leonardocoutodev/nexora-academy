# LC — Brand System

**Marca:** LC  
**Conceito:** Learn & Create  
**Assinatura:** Aprenda. Pratique. Crie.  
**Proposta de valor:** Conhecimento que vira habilidade.

## Paleta oficial

- LC Ink — `#07111F`
- LC Navy — `#0D1B2E`
- LC Blue — `#2878FF`
- LC Mint — `#38E6B0`
- LC White — `#F6F8FC`
- Texto secundário — `#9DACC1`
- Sucesso — `#38E6B0`
- Atenção — `#FFB020`
- Erro — `#FF4D4F`

## Tipografia

Inter é a família oficial da interface e é carregada como webfont nos pesos 400, 500, 600, 700 e 800. O produto mantém fallback nativo de sistema para disponibilidade e resiliência.

- H1 mobile: 28px / 800
- H2: 22px / 700
- H3: 18px / 600
- Card: 16px / 600
- Corpo principal: 15–17px / 400–500
- Auxiliar: 12–13px / 400–500

## Uso do símbolo

O arquivo canônico é `public/assets/brand/lc-mark.svg`. O símbolo não deve ser redesenhado por página nem substituído por variações geradas ad hoc.

## Motion

- UI rápida: 150ms
- UI padrão: 200ms
- UI expressiva: 250ms
- easing: `cubic-bezier(.2,0,0,1)`

Movimento informa estado antes de decorar.

## Arquitetura verbal

- LC Learn — aprendizagem
- LC Labs — prática
- LC Projects — projetos
- LC Challenges — desafios
- Certificado LC — certificação

Termos conhecidos como aula, módulo e certificado são preservados para reduzir carga cognitiva.


## Status da migração de identidade

A marca pública canônica é **LC**. Interface, PWA, certificados, materiais, laboratórios, pagamentos e metadados utilizam a identidade LC.

Identificadores internos legados como o schema PostgreSQL `nexora`, aliases de sessão e slugs antigos de compatibilidade não são marca pública e só permanecem quando a troca poderia interromper dados ou integrações existentes. Novos endpoints e ativos devem usar nomes LC.


## Checklist de consistência visual

- LC Mark canônico: `public/assets/brand/lc-mark.svg`
- Tipografia: Inter 400–800
- Fundo principal: LC Ink
- Ação/navegação: LC Blue
- Progresso/sucesso: LC Mint
- Roxos da identidade anterior não fazem parte da paleta pública
- Nenhuma superfície deve recriar o monograma com CSS, texto estilizado ou variações ad hoc


## Sistema de lockups

A LC usa o monograma de forma diferente conforme o espaço disponível:

- **Compacto/mobile:** LC Mark sozinho. Não repetir “LC” ao lado do próprio símbolo.
- **Horizontal/institucional:** LC Mark + **Learn & Create**.
- **Nome em texto:** usar **LC** normalmente em títulos, certificados, metadados e linguagem editorial.
- O caractere **&** pode usar LC Mint como detalhe de assinatura.
- Em headers mobile e outros espaços estreitos, a assinatura textual deve desaparecer antes de reduzir excessivamente o símbolo.

A regra evita redundância visual e mantém “Learn & Create” como explicação institucional da marca.
