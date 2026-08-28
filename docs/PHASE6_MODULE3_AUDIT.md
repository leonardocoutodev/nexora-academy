# Fase 6 — Auditoria do Módulo 3: Decisões

Data: 28/08/2026

## Linha de base

Antes do refactor, o módulo **Decisões** possuía:

- 7 aulas;
- todas com exatamente 7 blocos;
- média aproximada de 2.281 caracteres por aula;
- 6 aulas com laboratório do tipo `checkpoint`;
- 1 aula com `pseudocode`;
- 7 questões no checkpoint;
- 3 materiais complementares.

O conteúdo estava conceitualmente correto, mas repetia uma arquitetura quase idêntica e oferecia pouca evidência prática de cobertura de ramos.

## Objetivo do refactor

Ensinar decisões como **sistemas de casos verificáveis**, não como uma sequência de palavras-chave.

Competências centrais:

- separar condição de ação;
- construir bifurcações;
- ordenar faixas;
- combinar condições;
- decidir quando aninhar;
- usar tabelas-verdade como roteiro de testes;
- tratar dados ausentes e inválidos antes da regra de negócio.

## Arquitetura final

| Aula | Minutos | Lab | Blocos | Caracteres aprox. |
|---|---:|---|---:|---:|
| Condição: escolha um caminho | 28 | expression | 7 | 2.289 |
| SE e SENÃO | 30 | pseudocode | 9 | 3.072 |
| SENÃO SE: várias faixas | 34 | decision_table | 8 | 2.507 |
| Condições compostas | 32 | expression | 8 | 2.327 |
| Aninhamento: decisão dentro de decisão | 32 | decision_table | 7 | 2.475 |
| Tabela-verdade prática | 30 | decision_table | 9 | 2.990 |
| Decisões robustas: caso ausente e inválido | 38 | decision_table | 9 | 2.784 |

Indicadores:

- média aproximada: **2.635 caracteres por aula**;
- tempo estimado total: **224 minutos**;
- **3 tipos de laboratório**;
- **10 questões**;
- **4 materiais complementares**;
- nenhuma aula com estrutura inválida na auditoria de banco.

## Novo laboratório: Decision Table Lab

O laboratório apresenta vários casos da mesma regra e exige que o aluno associe cada entrada à saída correta.

Ele é usado quando a competência depende de:

- múltiplos ramos;
- faixas;
- ordem de condições;
- árvore de decisão;
- tabela-verdade;
- estados inválidos/ausentes.

O componente possui controles com nome acessível e alvos compatíveis com a matriz mobile.

## Avaliação

O checkpoint passou de 7 para 10 questões e cobre:

1. condição como pergunta;
2. exclusividade SE/SENÃO;
3. ordem de faixas;
4. lógica composta;
5. justificativa de aninhamento;
6. tabela-verdade;
7. dados ausentes;
8. teste de fronteira;
9. tabela de decisão como documentação;
10. distinção entre não elegível e entrada inválida.

## Materiais

1. **Apostila LC — Decisões e caminhos**
2. **Checklist de cobertura de decisões**
3. **Oficina — Motor de classificação**
4. **Caderno de bugs — Decisões**

## Gate editorial

Validação SQL pós-refactor:

- aulas: 7;
- aulas inválidas: 0;
- questões: 10;
- questões inválidas: 0;
- recursos: 4.

O módulo só será considerado publicado após CI, Chromium, acessibilidade, matriz mobile, Lighthouse, Firefox/WebKit, deploy e Production Browser QA verdes.
