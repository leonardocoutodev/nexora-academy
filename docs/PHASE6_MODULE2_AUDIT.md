# Fase 6 — Auditoria do Módulo 2: Dados e expressões

Data: 28/08/2026

## Escopo

Primeiro refactor completo do LC Content Standard 1.0 aplicado ao curso **Lógica de Programação Básica**.

Módulo auditado: **Dados e expressões**.

## Linha de base antes do refactor

- 7 aulas publicadas;
- todas com 7 blocos;
- todas usando laboratório do tipo `checkpoint`;
- média aproximada de 2.487 caracteres de conteúdo por aula;
- 7 questões no checkpoint do módulo;
- 3 materiais complementares;
- padrão recorrente: contexto → conceito → exemplo → mecânica/comparação → pergunta guiada → erro → resumo.

O conteúdo possuía boa correção conceitual, mas a experiência era excessivamente previsível e parte da prática se limitava a múltipla escolha.

## Mudanças executadas

### Arquitetura de aula

As aulas passaram a ter entre 7 e 9 blocos, definidos pela competência e não por um molde fixo.

Foram introduzidos e reutilizados intencionalmente blocos como:

- `purpose`;
- `guided_practice`;
- `guided_analysis`;
- `professional_context`;
- `mastery`;
- exemplos múltiplos quando a competência exige comparação ou teste.

### Laboratórios

Foram adicionados dois laboratórios reutilizáveis à plataforma:

#### Data Model Lab

Aplicado às aulas de:

1. Variáveis;
2. Constantes;
3. Tipos.

O aluno classifica elementos de um cenário real antes de avançar, distinguindo estado, regra, entrada externa, booleano e tipos do domínio.

#### Expression Lab

Aplicado às aulas de:

4. Operadores aritméticos;
5. Comparações;
6. Operadores lógicos;
7. Expressões completas.

O aluno escolhe uma expressão e a confronta com casos de teste explícitos, incluindo fronteiras e cenários que isolam condições.

Os Labs possuem fallback de checkpoint para compatibilidade com versões anteriores do frontend.

## Resultado quantitativo após o refactor

| Aula | Minutos | Lab | Blocos | Caracteres aprox. |
|---|---:|---|---:|---:|
| Variáveis: nomes para valores | 28 | data_model | 7 | 2.854 |
| Constantes: valores que não deveriam mudar | 24 | data_model | 8 | 2.790 |
| Números, textos e booleanos | 30 | data_model | 8 | 2.689 |
| Operadores aritméticos | 32 | expression | 8 | 2.150 |
| Comparações produzem verdadeiro ou falso | 28 | expression | 9 | 2.708 |
| Operadores lógicos: E, OU e NÃO | 32 | expression | 8 | 2.165 |
| Expressões: combine valores e operadores | 36 | expression | 9 | 2.510 |

Indicadores consolidados:

- média aproximada: **2.552 caracteres por aula**;
- tempo editorial estimado do módulo: **210 minutos**;
- **10 questões** no checkpoint;
- **4 materiais complementares**;
- **2 tipos de laboratório prático**;
- **3 quantidades estruturais de blocos** diferentes no estado final: 7, 8 e 9.

A quantidade de caracteres não é meta de qualidade; é usada somente como sinal de auditoria para evitar regressão para aulas excessivamente curtas.

## Checkpoint do módulo

O checkpoint passou de 7 para 10 questões.

As novas questões cobrem:

- significado de nomes;
- constantes;
- conversão de tipos;
- precedência;
- fronteiras;
- lógica composta;
- decomposição;
- identificadores textuais;
- detecção de bug em limite;
- refatoração de expressões complexas.

A distribuição foi construída para avaliar aplicação e diagnóstico, não apenas lembrança literal.

## Materiais

O módulo passa a oferecer:

1. **Apostila LC — Dados, tipos e expressões**
2. **Guia de depuração de expressões**
3. **Oficina — Regra de desconto verificável**
4. **Caderno de casos — Dados e expressões**

O quarto material introduz casos diferentes dos exemplos principais das aulas para estimular transferência.

## Critério de aprovação editorial

Este módulo só deve ser usado como referência para os próximos após:

- CI verde;
- novos Labs cobertos por E2E;
- ausência de overflow na matriz mobile;
- acessibilidade sem violações serious/critical;
- Lighthouse dentro dos budgets;
- smoke Firefox/WebKit aprovado;
- Production Browser QA aprovado.

## Próxima ação após publicação

Aplicar a mesma metodologia ao **Módulo 3 — Decisões**, evitando copiar a arquitetura do Módulo 2.

O objetivo é preservar o padrão de qualidade, não o formato visual ou a sequência de blocos.
