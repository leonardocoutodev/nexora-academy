# LC Phase 6 — Full Catalog Audit

Date: 2026-08-28  
Standard: LC Content Standard 1.0  
Scope: all published LC — Learn & Create courses.

## Executive result

Phase 6 has been expanded from the Logic pilot to the complete published catalog.

- 9 published courses
- 44 modules
- 368 published lessons
- 14,057 estimated learning minutes (~234 h 17 min)
- 53 published assessments
- 411 assessment questions
- 35 published projects / Boss Fights
- 23 lab types in use
- 26 checkpoint-only labs remaining where a lightweight check is pedagogically intentional
- 0 unsupported lab types after adding native Decision Table support
- 0 residual "Nexora" references in published lesson content/objectives
- 0 weak lesson objectives in the automated content audit

## Courses

| Course | Lessons | Est. min | Blocks | Checkpoints | Lab variety | Questions | Avg. difficulty | Definition-only | Projects |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Desenvolvimento de Sistemas com IA | 139 | 5,460 | 6–9 | 0 | 12 | 132 | 2.55 | 0 | 15 |
| IA Generativa para Trabalho e Negócios | 115 | 4,518 | 6–9 | 13 | 9 | 116 | 2.55 | 0 | 13 |
| Introdução à Web | 14 | 514 | 6–9 | 1 | 3 | 20 | 2.80 | 0 | 1 |
| Lógica de Programação Básica | 35 | 1,176 | 6–8 | 6 | 6 | 49 | 2.10 | 0 | 1 |
| Matemática Básica para Programadores | 14 | 514 | 6–9 | 0 | 2 | 20 | 2.80 | 0 | 1 |
| Pensamento Computacional | 8 | 293 | 6–9 | 2 | 3 | 14 | 2.86 | 0 | 1 |
| Primeiros Passos com Python | 21 | 775 | 6–9 | 0 | 1 | 26 | 2.77 | 0 | 1 |
| Pseudocódigo e Fluxogramas | 8 | 293 | 6–9 | 0 | 2 | 14 | 2.86 | 0 | 1 |
| Terminal e Git para Iniciantes | 14 | 514 | 6–9 | 4 | 2 | 20 | 2.80 | 0 | 1 |

## Editorial changes

The legacy catalog used a uniform seven-block lesson template. Every non-pilot lesson had exactly seven blocks. The catalog now varies lesson architecture between six and nine blocks according to the competency.

Foundation courses use domain-specific contexts and evidence:

- computational thinking: problem definition, decomposition, abstraction, counterexamples
- pseudocode: inputs/outputs, representation, desk testing
- mathematics: formulas, units, precedence, boundaries and independent validation
- terminal/Git: state before command, intended effect, output and resulting state
- web: semantic structure, browser evidence, interaction, accessibility and responsive states
- Python: predicted output, execution, alternate inputs and debugging evidence

The two large AI courses use module-specific professional contexts rather than one generic pattern. Engineering modules emphasize reproducible behavior, failure paths and technical evidence. Generative-AI modules emphasize traceability, verification, limits, risk and human review.

## Labs

Generic checkpoints were replaced where an interactive environment better represents the competency. Existing supported environments include Logic, Data Model, Expression, Pseudocode, Prompt, Spreadsheet, JavaScript, TypeScript, Python, React, HTML, SQL, Terminal, API, Automation, Agent, RAG, Auth, Code AI, Product and Boss/Project labs.

Six Logic lessons already had rich `decision_table` configuration but the renderer did not implement that lab type. Phase 6 adds a native Decision Table Lab with:

- scenario and outcomes
- row-by-row classification
- configured feedback
- per-row correct/wrong states
- completion only after every row is correctly classified
- E2E and accessibility coverage

## Assessments

Before the catalog pass, the eight non-pilot courses had 362 questions dominated by the same definition-recognition pattern.

The assessment pass preserves assessment length and correct-answer IDs while replacing recall-only prompts with applied evidence:

- application review
- mastery validation
- boundary/failure reasoning
- integration across modules
- reproducible evidence and pre-defined success criteria

All eight residual definition-only questions in the original Logic final assessment were also replaced. Final state: **0 published questions using the legacy "Qual definição corresponde..." template**.

Automated integrity checks:

- 411/411 questions have valid option counts
- 411/411 contain the referenced correct option
- 0 duplicate option-label sets detected by the integrity audit
- 0 weak feedback records
- 53/53 published assessments randomize questions
- 53/53 use the standard pass score of 70

## Projects and certification

All 35 published projects now include:

- explicit deliverables
- required evidence
- review guidance
- minimum score aligned at 70

Completion rules remain aligned for all 9 courses:

- 100% required lesson progress
- 70 minimum assessment score
- 70 minimum project score
- all module assessments required
- final assessment required
- final project required
- certificate enabled

## Materials and references

Every one of the 44 published modules has:

- at least 3 published learning resources
- at least 1 active curriculum reference

The audit therefore did not add low-value PDFs solely to increase library volume.

## Data and security validation

This content pass does not add tables, policies or privileged functions. Real Supabase data was validated separately from UI mocks.

Current Supabase advisor findings include existing structural warnings around SECURITY DEFINER RPC exposure, the intentional RPC-only `product_events` architecture, and leaked-password protection still disabled. Performance advisor findings include pre-existing index/RLS optimization opportunities. These findings are tracked separately from the Phase 6 content release because this catalog change does not introduce them.

## QA gate

Before merge, the release must pass the existing Phase 5 gates:

- static/worker checks
- Chromium E2E
- Decision Table E2E
- serious/critical Axe accessibility checks
- responsive matrix
- Lighthouse budgets
- Firefox compatibility
- WebKit compatibility

Authenticated browser flows continue to use the controlled mock Supabase fixture; real schema/content integrity is validated directly against the production Supabase project.
