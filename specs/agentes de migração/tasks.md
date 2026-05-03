# Tasks: /reversa-migrate

## Resumo de implementação

Implementação em 4 ondas: (1) fundação (slash command, brief, skills compartilhadas, catálogos); (2) os 5 agentes do time de migração; (3) integração, pausas humanas e handoff; (4) instalação por engine, testes e documentação.

Cada task é atômica (um PR por task) e referencia os RFs que atende. Todas as tasks assumem que o usuário já tem `_reversa_sdd/` populado.

---

## Onda 1: Fundação

### TASK-01: Estrutura de diretórios e templates de artefatos

**Tipo**: Setup
**Depende de**: nenhuma
**Requisitos atendidos**: base para todos

**O que implementar**:
- Criar estrutura no repo do Reversa: `templates/migration/agents/`, `templates/migration/skills/`, `templates/migration/commands/`, `templates/migration/artifacts/`.
- Criar templates dos 14 artefatos markdown listados na tabela "Schemas dos demais artefatos" do `design.md`, com front-matter YAML padronizado conforme o cabeçalho comum especificado, campo `kind` identificador e seções obrigatórias com placeholders.
- Criar `templates/migration/expected_legacy_artifacts.yaml` com a lista declarativa de artefatos esperados em `_reversa_sdd/` (consumido pela pré-condição do slash command).

**Critério de aceite**:
- [ ] 14 templates markdown existem em `templates/migration/artifacts/` (não conta `.state.json` que é JSON, nem a pasta `parity_tests/`).
- [ ] Cada template tem front-matter válido (parseável por `gray-matter` ou equivalente).
- [ ] Cada template tem todas as seções obrigatórias listadas na tabela do `design.md`.
- [ ] `expected_legacy_artifacts.yaml` existe e parseia.
- [ ] Lint passa nos templates (markdown e YAML).

---

### TASK-02: Skill `read_legacy_specs`

**Tipo**: Skill
**Depende de**: TASK-01
**Requisitos atendidos**: base para RF-04 a RF-08

**O que implementar**:
- Skill em `templates/migration/skills/read_legacy_specs/`.
- SKILL.md descreve: dado o caminho de `_reversa_sdd/` e a lista de artefatos requeridos, lê, valida front-matter e retorna estrutura tipada.
- Validação rejeita artefatos sem `schemaVersion` ou com `kind` inesperado.
- Trata graciosamente artefatos opcionais.

**Critério de aceite**:
- [ ] Skill instalável pelo `npx reversa install`.
- [ ] Lê fixture e retorna estrutura esperada.
- [ ] Erros descritivos para artefatos malformados.

---

### TASK-03: Skill `render_artifact`

**Tipo**: Skill
**Depende de**: TASK-01
**Requisitos atendidos**: base para todos os agentes

**O que implementar**:
- Skill em `templates/migration/skills/render_artifact/`.
- Recebe: `kind` do artefato, conteúdo estruturado, caminho de output.
- Carrega template, preenche, valida, escreve.
- Hash SHA-256 no front-matter.
- Garante tagging de evidência (🟢🟡🔴⚠️) onde aplicável.

**Critério de aceite**:
- [ ] Renderiza os 15 tipos de artefato.
- [ ] Roundtrip render → parse → render produz mesma string.
- [ ] Hash bate com conteúdo.

---

### TASK-04: Skill `state_checkpoint`

**Tipo**: Skill
**Depende de**: TASK-01
**Requisitos atendidos**: RF-11

**O que implementar**:
- Skill em `templates/migration/skills/state_checkpoint/`.
- Operações: `read`, `write`, `mark_agent_complete`, `mark_agent_failed`, `mark_pending_decision`, `record_artifact`.
- Schema do `.state.json` conforme design.md, com 5 agentes.
- Backup automático antes de operações destrutivas.

**Critério de aceite**:
- [ ] Estado persistido e relido corretamente.
- [ ] Backup gerado em `.backup-<timestamp>/` antes de `--regenerate`.
- [ ] Hashes detectam modificação manual.

---

### TASK-05: Skill `human_decision_gate`

**Tipo**: Skill
**Depende de**: TASK-04
**Requisitos atendidos**: RF-09

**O que implementar**:
- Skill em `templates/migration/skills/human_decision_gate/`.
- Apresenta sumário no formato apropriado para a engine.
- Para Claude Code: `pending_decisions.md` + canal de chat.
- Para outras engines: equivalente.
- Suporta flag `--auto`.

**Critério de aceite**:
- [ ] Pausa pipeline e coleta resposta antes de continuar.
- [ ] `pending_decisions.md` lista decisões com contexto.
- [ ] `--auto` documentado e funcional.

---

### TASK-06: Skill `paradigm_catalog` (consultiva)

**Tipo**: Skill
**Depende de**: TASK-01
**Requisitos atendidos**: RF-04

**O que implementar**:
- Skill em `templates/migration/skills/paradigm_catalog/`.
- Catálogo de paradigmas: procedural, OO clássico, OO com DI, funcional, event-driven, actor model, dataflow.
- Catálogo de stacks → paradigma natural (mínimo: Node moderno, Go, Rust, Elixir, Python moderno, Kotlin, .NET 8, Java moderno, Ruby moderno).
- Tabela de gaps típicos por par (paradigma origem, paradigma destino).
- Função utilitária: dado paradigma legado e stack alvo, retorna paradigma natural inferido + lista de implicações concretas.

**Critério de aceite**:
- [ ] Catálogo documentado e versionado.
- [ ] 9 stacks cobertas mínimo.
- [ ] Pelo menos 12 pares de gap mapeados (ex: procedural → async/event-driven, OO clássico → funcional, etc.).
- [ ] Função utilitária testada com 8 cenários.
- [ ] Atualização do catálogo é independente do agente Paradigm Advisor.

---

### TASK-07: Skill `migration_strategies` (consultiva)

**Tipo**: Skill
**Depende de**: TASK-01
**Requisitos atendidos**: RF-06

**O que implementar**:
- Skill em `templates/migration/skills/migration_strategies/`.
- Catálogo das 4 estratégias com descrição, quando aplica, custo, risco, tempo, exemplo, referências.
- Função utilitária: dado brief + apetite derivado, retorna estratégias aplicáveis e recomendada.

**Critério de aceite**:
- [ ] 4 estratégias completas.
- [ ] Função de recomendação testada com 6 cenários.
- [ ] Versionamento independente do agente Strategist.

---

### TASK-08: Slash command `/reversa-migrate` (esqueleto)

**Tipo**: Command
**Depende de**: TASK-02, TASK-03, TASK-04, TASK-05
**Requisitos atendidos**: RF-02, RF-03

**O que implementar**:
- Command em `templates/migration/commands/reversa-migrate.md`.
- Verificação de pré-condição (`_reversa_sdd/` completo).
- Lista de artefatos esperados carregada de configuração.
- Entrevista de brief (incluindo stack alvo) e geração do `migration_brief.md`.
- Detecção de execução existente; oferece resume / regenerate / cancel.
- Stub das invocações dos 5 agentes.

**Critério de aceite**:
- [ ] Aborta com mensagem clara se `_reversa_sdd/` não existe ou está incompleto.
- [ ] Conduz entrevista de brief incluindo stack alvo.
- [ ] Detecta brief existente e oferece opções.

---

## Onda 2: Os 5 agentes

### TASK-09: Agente Paradigm Advisor

**Tipo**: Agent
**Depende de**: TASK-02, TASK-03, TASK-06
**Requisitos atendidos**: RF-04

**O que implementar**:
- Agente em `templates/migration/agents/paradigm_advisor.md`.
- Persona conforme design.md.
- Política de detecção do paradigma legado (procedural, OO, funcional, event-driven, híbrido) com evidências de `domain_model.md`, `process_flows.md`, `legacy_inventory.md`.
- Inferência via `paradigm_catalog` a partir da stack alvo.
- Apresentação concreta do gap (não abstrato), com exemplos do próprio sistema legado.
- Apresentação das 3 opções (adotar natural / forçar similar / híbrido) com consequências.
- Registro de decisão em `paradigm_decision.md`, incluindo `derived_appetite`.

**Critério de aceite**:
- [ ] Em fixture com legado procedural + stack Node, detecta procedural e infere async/event-driven.
- [ ] Apresenta gap com no mínimo 4 implicações concretas.
- [ ] Apresenta as 3 opções com consequências distintas.
- [ ] `paradigm_decision.md` é completo e válido.
- [ ] Em fixture com legado e alvo no mesmo paradigma, confirma e prossegue sem decisões.

---

### TASK-10: Agente Curator

**Tipo**: Agent
**Depende de**: TASK-02, TASK-03, TASK-09
**Requisitos atendidos**: RF-05

**O que implementar**:
- Agente em `templates/migration/agents/curator.md`.
- Persona conforme design.md.
- Política de decisão explícita no prompt (regras 🟢/🟡/🔴/⚠️ → MIGRAR/DESCARTAR/DECISÃO HUMANA).
- Considera `paradigm_decision.md`: regras que são artefatos do paradigma legado podem ser DESCARTADAS quando paradigma muda.
- Outputs com rastreabilidade explícita.

**Critério de aceite**:
- [ ] Em fixture com 50 regras variadas, produz `target_business_rules.md` coerente.
- [ ] `discard_log.md` justifica cada descarte.
- [ ] Itens ⚠️ e 🔴 sempre em DECISÃO HUMANA.
- [ ] Em fixture com mudança de paradigma, descarta regras que são artefatos do paradigma antigo (ex: lock manual em alvo event-driven).

---

### TASK-11: Agente Strategist

**Tipo**: Agent
**Depende de**: TASK-07, TASK-10
**Requisitos atendidos**: RF-06

**O que implementar**:
- Agente em `templates/migration/agents/strategist.md`.
- Persona conforme design.md.
- Consulta `migration_strategies`.
- Considera `derived_appetite` do `paradigm_decision.md`.
- Outputs: `migration_strategy.md`, `risk_register.md`, `cutover_plan.md`.

**Critério de aceite**:
- [ ] Apresenta no mínimo 2 estratégias relevantes.
- [ ] Recomendação coerente com brief + apetite.
- [ ] `risk_register.md` lista riscos com probabilidade, impacto e mitigação.
- [ ] `cutover_plan.md` adequado à estratégia recomendada.
- [ ] Em fixture com mudança grande de paradigma + apetite transformacional, sinaliza explicitamente o risco e recomenda Parallel Run para validação.

---

### TASK-12: Agente Designer

**Tipo**: Agent
**Depende de**: TASK-11
**Requisitos atendidos**: RF-07

**O que implementar**:
- Agente em `templates/migration/agents/designer.md`.
- Persona conforme design.md.
- Princípios embutidos: bounded contexts por coesão, proibição de 1-para-1, rastreabilidade.
- Honra paradigma escolhido em `paradigm_decision.md`: event-driven exige eventos explícitos e estratégia de consistência eventual; OO com DI exige interfaces; funcional exige imutabilidade.
- Outputs: `target_architecture.md` (Mermaid), `target_domain_model.md`, `target_data_model.md`, `data_migration_plan.md`.

**Critério de aceite**:
- [ ] Em fixture com 4 "arquivos legados" que são 2 bounded contexts, produz arquitetura com 2 (não 4).
- [ ] Diagrama Mermaid válido.
- [ ] Cada elemento aponta para origem ou para `discard_log.md`.
- [ ] Em fixture com paradigma alvo event-driven, arquitetura especifica eventos, mensagens, consistência eventual, não fluxo síncrono linear.
- [ ] `data_migration_plan.md` define transformações, ETL, cutover.

---

### TASK-13: Agente Inspector

**Tipo**: Agent
**Depende de**: TASK-12
**Requisitos atendidos**: RF-08

**O que implementar**:
- Agente em `templates/migration/agents/inspector.md`.
- Persona conforme design.md.
- Critérios de paridade adaptados ao paradigma escolhido.
- Outputs: `parity_specs.md`, `parity_tests/*.feature`.
- Reusa `characterization_specs/` do time de descoberta como base.
- Critérios de "paridade aceita" explícitos.

**Critério de aceite**:
- [ ] Arquivos `.feature` em Gherkin válido.
- [ ] Cada scenario referencia origem em `process_flows.md` ou `target_architecture.md`.
- [ ] Em fixture com mudança síncrono → event-driven, `parity_specs.md` cobre ordem de mensagens, idempotência, consistência eventual, não apenas equivalência funcional.
- [ ] Em fixture sem mudança de paradigma, `parity_specs.md` usa equivalência funcional padrão.

---

## Onda 3: Integração e handoff

### TASK-14: Orquestração completa do `/reversa-migrate`

**Tipo**: Command
**Depende de**: TASK-08, TASK-09, TASK-10, TASK-11, TASK-12, TASK-13
**Requisitos atendidos**: RF-02 a RF-09

**O que implementar**:
- Substituir stubs do `/reversa-migrate` por invocações reais dos 5 agentes em sequência.
- Pausas com `human_decision_gate` entre agentes.
- Cada pausa apresenta resumo do agente anterior.
- `--auto` pula pausas usando defaults.
- `--resume` retoma do último agente concluído.
- `--regenerate=<agent>` apaga e refaz a partir do agente especificado.

**Critério de aceite**:
- [ ] Pipeline completo executa em fixture e gera todos os artefatos esperados (14 markdown + `parity_tests/*.feature` + `.state.json`).
- [ ] Cada pausa apresenta resumo coerente.
- [ ] `--resume` testado com falha simulada no Designer.
- [ ] Regra de cascata do `--regenerate=<agent>` é aplicada de forma geral: apaga outputs do agente especificado e de todos os agentes posteriores na ordem do pipeline (Paradigm Advisor → Curator → Strategist → Designer → Inspector). Casos verificados:
  - `--regenerate=paradigm_advisor` apaga tudo.
  - `--regenerate=curator` apaga Curator, Strategist, Designer, Inspector.
  - `--regenerate=strategist` apaga Strategist, Designer, Inspector.
  - `--regenerate=designer` apaga Designer, Inspector.
  - `--regenerate=inspector` apaga apenas Inspector.
- [ ] Defaults de `--auto` (especificados em `design.md`) são aplicados corretamente para cada agente.

---

### TASK-15: Geração de `handoff.md`

**Tipo**: Command
**Depende de**: TASK-14
**Requisitos atendidos**: RF-10

**O que implementar**:
- Após Inspector concluir, gerar `handoff.md`.
- Conteúdo: lista de artefatos, ordem recomendada de leitura (com `paradigm_decision.md` em primeiro lugar como leitura obrigatória), itens pendentes em `ambiguity_log.md`, próximos passos para o agente de codificação.
- Formato adaptado à engine instalada.

**Critério de aceite**:
- [ ] `handoff.md` lista todos os artefatos.
- [ ] `paradigm_decision.md` aparece como leitura prioritária.
- [ ] Próximos passos específicos e acionáveis.
- [ ] Formato adaptado testado para ao menos 2 engines.

---

### TASK-16: Consolidação de `ambiguity_log.md`

**Tipo**: Command
**Depende de**: TASK-14
**Requisitos atendidos**: RF-10

**O que implementar**:
- Cada agente adiciona itens ⚠️ a `ambiguity_log.md` quando aplicável.
- Ao final, command consolida e organiza por status: PENDENTE, RESOLVIDO COM DECISÃO HUMANA, REFERIDO À CODIFICAÇÃO.
- Rastreabilidade: cada item aponta para origem e para o agente que detectou.

**Critério de aceite**:
- [ ] Itens ⚠️ aparecem independente do agente de origem.
- [ ] Status final coerente: nenhum item PENDENTE quando o pipeline conclui.

---

### TASK-17: Resumo final e logs

**Tipo**: Command
**Depende de**: TASK-15, TASK-16
**Requisitos atendidos**: RF-11, NF-Observabilidade

**O que implementar**:
- Resumo no chat ao final: agentes executados, artefatos criados/atualizados, contagem de evidências, tempo total, pendências.
- Log completo em `.logs/<timestamp>-migrate.log` com timestamp e identificação do agente em cada entrada.
- Telemetria de tokens e custo estimado por agente: best-effort, dependente da engine. Quando a engine não expõe contagem de tokens via slash command, os campos ficam vazios sem invalidar o log.

**Critério de aceite**:
- [ ] Resumo aparece em todas as execuções bem-sucedidas.
- [ ] Logs gravados em `.logs/` com timestamp e agente.
- [ ] Tabela de preços é configurável (consumida apenas se a engine fornecer tokens).
- [ ] Em engine sem suporte a contagem de tokens, log é gerado sem custo, sem erro.

---

## Onda 4: Instalação, testes e documentação

### TASK-18: Adaptadores de instalação por engine

**Tipo**: Setup
**Depende de**: TASK-09 a TASK-13
**Requisitos atendidos**: RF-01

**O que implementar**:
- Estender `npx reversa install` para detectar engine e instalar 5 agentes + skills + command no formato nativo:
  - **Claude Code**: agentes em `.claude/agents/migration/`, command em `.claude/commands/reversa-migrate.md`, skills em `.claude/skills/migration/`.
  - **Cursor**: rules em `.cursor/rules/migration/`, command customizado.
  - **Codex**, **Antigravity**: conforme adaptadores existentes.
- Não sobrescreve agentes do time de descoberta.
- Mensagem clara após `install` separando "Time de Descoberta" e "Time de Migração".

**Critério de aceite**:
- [ ] Instalação testada em ao menos 3 engines.
- [ ] `/reversa-migrate` registrado e executável após install.
- [ ] Reinstalação idempotente.

---

### TASK-19: Testes end-to-end com fixtures

**Tipo**: Testes
**Depende de**: TASK-17, TASK-18
**Requisitos atendidos**: todos

**O que implementar**:
- 4 fixtures de `_reversa_sdd/` em `tests/fixtures/migration/`:
  - `php-procedural-to-node-async/`: mudança grande de paradigma, ~30 regras.
  - `rails-monolith-to-go-microservices/`: mudança média, ~150 regras, integrações.
  - `dotnet-webforms-to-blazor/`: mesmo paradigma OO, mudança de framework, ~100 regras.
  - `cobol-batch-to-event-driven/`: mudança extrema de paradigma, ~50 regras, itens ⚠️.
- Cada fixture tem expected outputs versionados.
- Testes E2E executam `/reversa-migrate --auto` e comparam outputs (com tolerância para variações de timestamp e ordem).

**Critério de aceite**:
- [ ] 4 fixtures rodam end-to-end e validam outputs.
- [ ] Documentação de como adicionar novo fixture.
- [ ] Tempo total da suíte ≤ 20 minutos.

---

### TASK-20: Documentação para usuários

**Tipo**: Documentação
**Depende de**: TASK-17
**Requisitos atendidos**: todos

**O que implementar**:
- Atualizar README do Reversa com seção "Migração".
- `docs/migration/getting-started.md`: tutorial completo do `/reversa` ao `/reversa-migrate` ao handoff.
- `docs/migration/agents.md`: descrição dos 5 agentes com inputs, outputs, exemplos.
- `docs/migration/paradigm-shift.md`: explicação do problema de mudança de paradigma e como o Paradigm Advisor trata.
- `docs/migration/strategies.md`: catálogo de estratégias.
- `docs/migration/brief-template.md`: schema do brief.

**Critério de aceite**:
- [ ] Tutoriais executáveis (passo a passo testado).
- [ ] Cada agente tem página dedicada com exemplo real de output.
- [ ] Página de paradigm-shift com exemplo concreto (PHP procedural → Node async).

---

### TASK-21: Página dedicada para vídeo / pitch (opcional)

**Tipo**: Documentação (marketing, fora do escopo técnico)
**Depende de**: TASK-20
**Requisitos atendidos**: nenhum

**Observação**: tarefa opcional, não bloqueia release técnico. Pode ser endereçada em ciclo separado de comunicação/marketing.

**O que implementar**:
- `docs/migration/why.md`: pitch curto ("Claude Code, Codex e Antigravity são ótimos para escrever código novo. O Reversa é o que faz eles entenderem o seu código antigo."), exemplos visuais.
- Diagrama do pipeline em ASCII / Mermaid mostrando os dois times (Descoberta e Migração).
- Comparativo Reversa vs LLM genérico.

**Critério de aceite**:
- [ ] Página coerente com narrativa estratégica.
- [ ] Diagramas renderizam corretamente em GitHub.

---

## Resumo de dependências (DAG)

```
TASK-01 (templates)
    ├── TASK-02 (read_legacy_specs)
    ├── TASK-03 (render_artifact)
    ├── TASK-04 (state_checkpoint)
    │   └── TASK-05 (human_decision_gate)
    ├── TASK-06 (paradigm_catalog)
    └── TASK-07 (migration_strategies)

TASK-02, TASK-03, TASK-04, TASK-05
    └── TASK-08 (slash command esqueleto)

TASK-02, TASK-03, TASK-06
    └── TASK-09 (Paradigm Advisor)
        └── TASK-10 (Curator)
            └── TASK-11 (Strategist) ─── depende de TASK-07
                └── TASK-12 (Designer)
                    └── TASK-13 (Inspector)

TASK-08, TASK-09, TASK-10, TASK-11, TASK-12, TASK-13
    └── TASK-14 (orquestração completa)
        ├── TASK-15 (handoff.md)
        ├── TASK-16 (ambiguity_log consolidado)
        └── TASK-17 (resumo final + logs)

TASK-09 a TASK-13
    └── TASK-18 (adaptadores de engine)

TASK-17, TASK-18
    └── TASK-19 (E2E tests)

TASK-17
    └── TASK-20 (docs)
        └── TASK-21 (pitch / vídeo)
```

**Ondas mergeáveis incrementalmente:**
- **Onda 1 (TASK-01..08)**: infraestrutura, brief e catálogos funcionais.
- **Onda 2 (TASK-09..13)**: cada agente individualmente, mergeável e testável isolado.
- **Onda 3 (TASK-14..17)**: pipeline completo funcional end-to-end.
- **Onda 4 (TASK-18..21)**: instalação multi-engine, testes E2E e documentação.

Ao final da Onda 3, `/reversa-migrate` é funcional para a engine principal de desenvolvimento. Onda 4 expande para multi-engine e produção.
