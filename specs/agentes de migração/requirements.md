# Requirements: /reversa-migrate

## Visão geral

Esta spec define o módulo de **migração** do Reversa: um time de 5 agentes especializados (Paradigm Advisor, Curator, Strategist, Designer, Inspector) e um slash command `/reversa-migrate` que, juntos, transformam as specs de um sistema legado (já produzidas pelo Reversa) em specs prontas para reconstrução em um sistema moderno.

A migração é um **passo seguinte** ao fluxo principal do Reversa. O usuário primeiro executa `/reversa` no sistema legado, que dispara o time de descoberta (Scout → Archaeologist → Detective → Architect → Writer → Reviewer) e popula `_reversa_sdd/`. Apenas após a conclusão dessa etapa o usuário pode executar `/reversa-migrate`, que dispara o time de migração e popula `_reversa_sdd/migration/`.

O time de migração não toca em código legado, não faz parsing de schemas, não faz arqueologia. Opera **100% no nível das specs** já produzidas. A execução do código novo (escrever em Node, Go, etc.) é responsabilidade do agente de codificação do usuário (Claude Code, Codex, Antigravity, Cursor, etc.), fora do escopo do Reversa.

```
Time de Descoberta:    Scout → Archaeologist → Detective → Architect → Writer → Reviewer
                                              │
                                              ▼
                                       _reversa_sdd/
                                              │
                                              ▼
Time de Migração:      Paradigm Advisor → Curator → Strategist → Designer → Inspector
                                              │
                                              ▼
                                  _reversa_sdd/migration/
                                              │
                                              ▼
                          Agente de codificação do usuário escreve código
```

## Personas e contexto de uso

- **Arquiteto de Software Sênior**: planeja a migração de um sistema legado. Já rodou `/reversa` e tem `_reversa_sdd/` populado. Quer specs rastreáveis para tomar decisões de arquitetura. Usuário primário.

- **Tech Lead / Engenheiro de Plataforma**: vai operar o `/reversa-migrate` no projeto. Precisa que o pipeline seja confiável, com saída previsível e artefatos consumíveis pelo agente de codificação.

- **Stakeholder de Negócio**: consome `migration_strategy.md` e `risk_register.md` para entender escopo, custo e risco. Não opera o comando, mas é leitor crítico de alguns artefatos.

## Interpretações adotadas

Decisões tomadas na conversa que originou esta spec:

- O time de migração tem **5 agentes** (decisão tomada após percepção que paradigma de programação merece tratamento dedicado).
- Os agentes nomeados são: **Paradigm Advisor, Curator, Strategist, Designer, Inspector**.
- O **Paradigm Advisor roda primeiro** porque paradigma molda inclusive o que conta como regra de negócio migrável.
- O slash command é **`/reversa-migrate`**.
- A migração só pode ser executada após `/reversa` completar com sucesso.
- O Paradigm Advisor **detecta** paradigma do legado (não pergunta), **infere** paradigma natural da stack alvo, **alerta** sobre gaps, e **força decisão consciente** do usuário sobre como tratar o gap. Isso porque usuários frequentemente não percebem que estão mudando de paradigma quando mudam de linguagem.
- Apetite de migração não é perguntado separadamente: é derivado das escolhas de paradigma e registrado em `paradigm_decision.md`.
- Time de descoberta atual termina em **Reviewer**, não em Writer (correção feita após esclarecimento do usuário).

## Requisitos funcionais

### RF-01: Instalação dos agentes de migração junto ao Reversa

**WHEN** o usuário executa `npx reversa install`, **THE SYSTEM SHALL** instalar os 5 agentes de migração (Paradigm Advisor, Curator, Strategist, Designer, Inspector), as skills auxiliares e o slash command `/reversa-migrate` no formato apropriado para a engine de IA detectada.

**Critério de aceite**:
- A instalação suporta as mesmas engines já suportadas pelo Reversa atual.
- Cada engine recebe os agentes no formato nativo dela.
- O slash command `/reversa-migrate` aparece registrado na engine após `install`.
- Instalação não modifica nem sobrescreve agentes do time de descoberta já instalados.
- `npx reversa install` exibe mensagem listando o que foi instalado, separando "Time de Descoberta" e "Time de Migração".

---

### RF-02: Slash command `/reversa-migrate` com pré-condição

**WHEN** o usuário executa `/reversa-migrate`, **THE SYSTEM SHALL** verificar a existência e completude de `_reversa_sdd/` antes de iniciar o pipeline.

**Critério de aceite**:
- Se `_reversa_sdd/` não existir, mensagem: "Execute `/reversa` primeiro para gerar as specs do sistema legado."
- Se `_reversa_sdd/` existir mas estiver incompleto, lista quais artefatos faltam e aborta.
- Se `_reversa_sdd/` estiver completo, inicia o pipeline.
- A lista de artefatos esperados é configurável (não hardcoded) para suportar evolução futura do time de descoberta.

---

### RF-03: Coleta inicial do critério de migração (brief)

**WHEN** `/reversa-migrate` é executado pela primeira vez em um projeto, **THE SYSTEM SHALL** conduzir uma entrevista para coletar o critério de migração e gerar `_reversa_sdd/migration/migration_brief.md` antes de invocar qualquer agente.

**Critério de aceite**:
- Perguntas mínimas: objetivo da migração, métricas de sucesso, restrições (prazo, orçamento, técnicas), fatores de risco, stakeholders, **stack alvo** (linguagem/framework/infra desejados).
- Em execuções subsequentes, se `migration_brief.md` já existir, oferece revisar / manter / recriar.
- Front-matter YAML com campos tipados, para consumo programático pelos agentes.
- O brief **não pergunta paradigma**: isso é responsabilidade do Paradigm Advisor.
- O brief **não pergunta apetite**: isso é derivado depois.

---

### RF-04: Agente Paradigm Advisor (detecta, infere, alerta, decide paradigma)

**WHEN** o pipeline inicia (após o brief), **THE SYSTEM SHALL** invocar o agente Paradigm Advisor primeiro. O agente lê os artefatos de `_reversa_sdd/` para detectar o paradigma do sistema legado, infere o paradigma natural da stack alvo declarada no brief, alerta sobre gaps de paradigma e conduz uma decisão consciente do usuário, produzindo `_reversa_sdd/migration/paradigm_decision.md`.

**Critério de aceite**:
- O agente identifica explicitamente o paradigma do legado (procedural, OO clássico, OO com DI, funcional, event-driven, etc.) com evidências de `_reversa_sdd/` (estrutura de código, padrões observados em `domain_model.md` e `process_flows.md`).
- O agente identifica o paradigma natural da stack alvo do brief consultando a skill `paradigm_catalog`.
- Se houver gap entre paradigmas, o agente apresenta as implicações concretas (tratamento de erro, consistência, ordem de execução, observabilidade), não em abstrato.
- O agente apresenta ao usuário 3 opções de tratamento do gap: **adotar paradigma natural da stack** / **forçar paradigma similar ao legado** / **híbrido**, com trade-offs explícitos de cada.
- O `paradigm_decision.md` registra: paradigma legado detectado, paradigma alvo inferido, gap identificado, escolha do usuário, apetite derivado (`conservative` / `balanced` / `transformational`), implicações pendentes a serem honradas pelos próximos agentes.
- O agente preserva sistema de evidências (🟢🟡🔴⚠️) nas afirmações sobre o paradigma legado.
- Se o legado e a stack alvo têm o mesmo paradigma, o agente confirma com o usuário e prossegue sem decisões adicionais.

---

### RF-05: Agente Curator (decide o que migra e o que descarta)

**WHEN** Paradigm Advisor conclui sua execução com sucesso, **THE SYSTEM SHALL** invocar o agente Curator. O agente lê `_reversa_sdd/` (especialmente `business_rules.md`, `process_flows.md`, `pain_points.md`, `integrations.md`) e o `paradigm_decision.md`, e produz `target_business_rules.md` e `discard_log.md` em `_reversa_sdd/migration/`.

**Critério de aceite**:
- `target_business_rules.md` lista cada regra de negócio do legado com decisão: MIGRAR / DESCARTAR / DECISÃO HUMANA, e justificativa por item.
- O Curator considera o `paradigm_decision.md` ao decidir: regras que são artefatos do paradigma legado (não do negócio) podem ser DESCARTADAS quando o paradigma muda.
- `discard_log.md` registra explicitamente o que foi descartado e por quê.
- Cada item tem rastreabilidade: aponta para a regra/seção de origem em `_reversa_sdd/`.
- Cada item ⚠️ AMBÍGUO do legado é elevado a "DECISÃO HUMANA" e listado em seção dedicada de `target_business_rules.md`.
- Curator preserva sistema de evidências.

---

### RF-06: Agente Strategist (propõe estratégia de migração)

**WHEN** Curator conclui com sucesso, **THE SYSTEM SHALL** invocar o agente Strategist. O agente lê o brief, o `paradigm_decision.md`, o domain model legado e o output do Curator, e produz `migration_strategy.md`, `risk_register.md` e `cutover_plan.md`.

**Critério de aceite**:
- `migration_strategy.md` apresenta no mínimo 2 estratégias possíveis (entre Strangler Fig, Big Bang, Parallel Run, Branch by Abstraction) com trade-offs explícitos.
- O Strategist considera o apetite derivado do `paradigm_decision.md`: apetite `conservative` favorece Strangler Fig e Branch by Abstraction; `transformational` permite Big Bang em sistemas pequenos.
- O Strategist marca uma estratégia como "recomendada" com justificativa baseada em brief + paradigma + apetite.
- A escolha final é decisão humana: o usuário deve confirmar antes do Designer prosseguir.
- `risk_register.md` lista riscos com probabilidade, impacto e mitigação.
- `cutover_plan.md` esboça plano de corte (passos, janela, rollback).

---

### RF-07: Agente Designer (desenha as specs do sistema novo)

**WHEN** Strategist conclui e o usuário confirma a estratégia, **THE SYSTEM SHALL** invocar o agente Designer. O agente produz as specs do sistema novo: `target_architecture.md`, `target_domain_model.md`, `target_data_model.md`, `data_migration_plan.md`.

**Critério de aceite**:
- `target_architecture.md` define a arquitetura alvo com diagrama Mermaid, **respeitando o paradigma escolhido em `paradigm_decision.md`**.
- `target_domain_model.md` define o domain model do sistema novo, com rastreabilidade explícita para o legado.
- `target_data_model.md` define o schema de dados alvo.
- `data_migration_plan.md` define como migrar dados do legado para o novo (transformações, ETL, cutover de dados).
- Designer não decompõe ingenuamente 1-para-1: identifica bounded contexts reais e justifica agrupamentos/separações.
- Toda decisão de design tem justificativa rastreável.
- Quando o paradigma exige (ex: event-driven), Designer especifica explicitamente eventos, mensagens, estratégia de consistência eventual.

---

### RF-08: Agente Inspector (define provas de equivalência comportamental)

**WHEN** Designer conclui, **THE SYSTEM SHALL** invocar o agente Inspector. O agente produz `parity_specs.md` e `parity_tests/` em `_reversa_sdd/migration/`.

**Critério de aceite**:
- `parity_specs.md` define a estratégia geral de validação adequada à estratégia de migração e ao paradigma escolhido.
- Quando o paradigma muda significativamente (ex: síncrono → event-driven), Inspector especifica critérios de paridade adequados (cobertura de consistência eventual, ordem de mensagens, tratamento de falha), não apenas equivalência funcional ingênua.
- `parity_tests/` contém arquivos `.feature` em Gherkin para cada fluxo crítico, com rastreabilidade.
- Inspector reusa `characterization_specs/` do time de descoberta como base, adaptando para o sistema novo.
- Inspector explicita critérios de "paridade aceita" (ex: índice de divergência < 0.01% por 30 dias).
- Os arquivos `.feature` são specs (não testes executáveis).

---

### RF-09: Pontos de checagem humana entre agentes

**WHEN** o pipeline alcança um ponto de checagem entre agentes com decisões críticas pendentes, **THE SYSTEM SHALL** pausar e aguardar aprovação humana antes de prosseguir.

**Critério de aceite**:
- Pausas obrigatórias após: Paradigm Advisor (escolha de tratamento de gap), Curator (revisar itens DECISÃO HUMANA), Strategist (escolher estratégia), Designer (revisar arquitetura antes do Inspector criar testes baseados nela).
- Cada pausa apresenta resumo do que foi produzido e o que precisa de decisão.
- Modo `--auto` pula pausas e usa default de cada agente; não recomendado em produção.
- Modo padrão é interativo. `--auto` requer flag explícita.

---

### RF-10: Artefatos auxiliares produzidos colaborativamente

**WHEN** o pipeline conclui, **THE SYSTEM SHALL** consolidar dois artefatos auxiliares: `ambiguity_log.md` e `handoff.md`.

**Critério de aceite**:
- `ambiguity_log.md` consolida todos os itens ⚠️ pendentes ao longo do pipeline, com decisões tomadas e pendências.
- `handoff.md` é o artefato final voltado ao agente de codificação: lista todos os artefatos produzidos, ordem recomendada de leitura, bloqueadores para começar implementação, e **destacando o `paradigm_decision.md` como leitura obrigatória primeiro**.
- `handoff.md` é gerado no formato apropriado para a engine instalada.

---

### RF-11: Idempotência e retomada

**WHEN** `/reversa-migrate` é executado mais de uma vez, **THE SYSTEM SHALL** detectar artefatos existentes e oferecer: retomar de onde parou, regenerar tudo, regenerar a partir de um agente específico.

**Critério de aceite**:
- Estado é persistido em `_reversa_sdd/migration/.state.json` após cada agente concluir.
- Antes de regenerar, backup automático em `.backup-<timestamp>/`.
- Resumo final imprime: agentes executados, artefatos criados/atualizados, contagem de evidências (🟢🟡🔴⚠️), pendências.

---

### RF-12: Não-destrutividade

**WHILE** o pipeline executa, **THE SYSTEM SHALL NOT** modificar, sobrescrever ou deletar qualquer arquivo fora de `_reversa_sdd/migration/`.

**Critério de aceite**:
- Nenhuma escrita acontece fora de `_reversa_sdd/migration/`.
- Artefatos pré-existentes do time de descoberta em `_reversa_sdd/` são lidos, nunca modificados.
- Operações de `--regenerate` afetam apenas `_reversa_sdd/migration/`, com backup em `.backup-<timestamp>/` dentro do mesmo diretório.
- O código-fonte do projeto legado nunca é tocado.

## Requisitos não-funcionais

- **Compatibilidade**: rodar nas mesmas plataformas e engines já suportadas pelo Reversa.
- **Performance** (orientativa): para um `_reversa_sdd/` típico (até ~50 artefatos, ~500 regras), pipeline completo busca concluir em até 30 minutos, excluindo tempo de pausas humanas. Meta sujeita a calibração após primeiras execuções reais.
- **Confiabilidade**: falha de um agente preserva artefatos já produzidos. Retomada via `--resume`.
- **Observabilidade** (best-effort): chamadas de LLM logadas em `_reversa_sdd/migration/.logs/` com timestamp e agente. Captura de tokens e custo estimado é opcional, dependente da engine: quando a engine não expõe contagem de tokens via slash command, esses campos ficam vazios sem invalidar o log.
- **Engine-agnóstico**: nenhum agente depende de capacidades específicas de uma única engine.

## Fora de escopo

- **Execução do código novo**: responsabilidade do agente de codificação do usuário.
- **Análise ao vivo do banco legado** (`--db`): pertence a extensão futura do time de descoberta.
- **Telemetria Mining** (logs/traces de produção): mesma justificativa.
- **Cross-validation multi-LLM**: extensão futura opcional.
- **Loop de feedback pós-cutover**: spec separada, executa após migração estar em produção.
- **UI gráfica**: Reversa permanece CLI-first.
- **Migração em uma linguagem para múltiplas linguagens simultaneamente** (ex: monolito Java para microsserviços em linguagens diferentes): primeira versão assume **uma stack alvo**. Multi-stack fica para versão futura.

## Questões em aberto

- [ ] **Compatibilidade entre versões do `_reversa_sdd/`**: front-matter `schemaVersion` em todos os artefatos do Reversa. Decisão para spec de governança, não para esta.
- [ ] **Granularidade do `--resume`**: por agente é suficiente ou precisa ser por artefato? Recomendação: por agente.
- [ ] **Confirmação humana sem TTY interativo**: como `human_decision_gate` funciona quando rodando em CI ou agente sem terminal? Recomendação: agente escreve `pending_decisions.md` e o slash command consulta o usuário no chat da engine.
- [ ] **Tamanho dos artefatos**: artefatos do `_reversa_sdd/` podem ser grandes. Cada agente lê só o que precisa (declarado no design), mas pode haver casos extremos. Estratégia de chunking precisa ser detalhada por engine.
- [ ] **Stack alvo "indecisa" no brief**: o usuário pode declarar "estou avaliando entre Node e Go" no brief? Recomendação para v1: não, exigir uma stack. Para indecisão, rodar `/reversa-migrate` duas vezes em branches diferentes do projeto e comparar outputs.
- [ ] **Paradigm Advisor e legados híbridos**: sistemas que misturam paradigmas (ex: monolito Rails com partes em Sidekiq async): como tratar? Recomendação: Paradigm Advisor identifica como "híbrido" e força o usuário a escolher se a migração também será híbrida ou se vai unificar.
