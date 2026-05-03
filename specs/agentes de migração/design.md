# Design: /reversa-migrate

## Visão arquitetural

O módulo de migração estende o Reversa core com:

1. Um **time de 5 agentes** (Paradigm Advisor, Curator, Strategist, Designer, Inspector) instalados no formato nativo de cada engine.
2. Um **slash command `/reversa-migrate`** que orquestra o time.
3. **Skills auxiliares** compartilhadas: leitura de `_reversa_sdd/`, persistência de estado, render de artefatos, gates de decisão humana, catálogos consultivos.
4. **Templates de artefatos** padronizados.

A arquitetura reusa toda a infraestrutura existente do Reversa: instalação por engine, sistema de evidências, configuração via `.reversarc`. Não há nova CLI Node.js dedicada: `/reversa-migrate` é interpretado pela engine, exatamente como `/reversa`.

```
┌────────────────────────────────────────────────────────────────────┐
│  Engine de IA do usuário (Claude Code, Codex, Antigravity, etc.)   │
│                                                                     │
│  Slash command: /reversa-migrate                                    │
│       │                                                             │
│       ├──► Pre-check: _reversa_sdd/ completo?                       │
│       ├──► Brief interview (interativo)                           │
│       │                                                             │
│       ├──► [1] Paradigm Advisor                                     │
│       │       └── Detecta paradigma legado                          │
│       │       └── Infere paradigma natural da stack alvo            │
│       │       └── Alerta gap, força decisão consciente              │
│       │       └── Output: paradigm_decision.md                      │
│       │                                                             │
│       ├──► [Pausa: confirmação de paradigma]                        │
│       │                                                             │
│       ├──► [2] Curator                                              │
│       │       └── Output: target_business_rules.md, discard_log.md  │
│       │                                                             │
│       ├──► [Pausa: revisão de decisões humanas]                     │
│       │                                                             │
│       ├──► [3] Strategist                                           │
│       │       └── Output: migration_strategy.md, risk_register.md,  │
│       │                   cutover_plan.md                           │
│       │                                                             │
│       ├──► [Pausa: escolha de estratégia]                           │
│       │                                                             │
│       ├──► [4] Designer                                             │
│       │       └── Output: target_architecture.md,                   │
│       │                   target_domain_model.md,                   │
│       │                   target_data_model.md,                     │
│       │                   data_migration_plan.md                    │
│       │                                                             │
│       ├──► [Pausa: revisão da arquitetura]                          │
│       │                                                             │
│       ├──► [5] Inspector                                            │
│       │       └── Output: parity_specs.md, parity_tests/*.feature   │
│       │                                                             │
│       └──► Handoff: gera handoff.md no formato da engine            │
└────────────────────────────────────────────────────────────────────┘
```

## Componentes

### Slash command `/reversa-migrate`

**Responsabilidade**: orquestrar o pipeline de migração. Implementado como prompt declarativo no formato nativo da engine.

**Comportamento**:
1. Verifica pré-condição (`_reversa_sdd/` existe e completo).
2. Conduz entrevista de brief (se ausente).
3. Invoca os 5 agentes em sequência.
4. Gerencia pausas para revisão humana entre agentes.
5. Gera `handoff.md` final.

**Configuração da pré-condição**: a lista de artefatos esperados em `_reversa_sdd/` é declarada em `templates/migration/expected_legacy_artifacts.yaml` (versionado junto com o pacote do Reversa). Cada entrada tem nome, `kind`, obrigatoriedade (required/optional) e `minSchemaVersion`. O slash command lê esse arquivo na inicialização. Atualizar a lista é uma mudança de configuração, não exige reedição do command.

**Defaults usados em `--auto`** (modo não-interativo, evita pausas humanas):
- **Paradigm Advisor**: escolhe a opção 1 (adotar paradigma natural da stack alvo). `derived_appetite` = `transformational`.
- **Curator**: itens DECISÃO HUMANA são marcados como pendentes em `ambiguity_log.md` e não bloqueiam o pipeline; itens 🟡 são MIGRAR; itens 🔴 e ⚠️ são DESCARTAR com nota explícita "auto-descartado, requer revisão".
- **Strategist**: adota a estratégia marcada como "recomendada".
- **Designer**: aprova a primeira proposta de arquitetura, sem iteração.
- **Inspector**: usa critérios de paridade derivados diretamente do paradigma escolhido, sem ajuste interativo.

`--auto` exibe aviso explícito antes de iniciar listando todos os defaults que serão aplicados, e o `handoff.md` final destaca itens auto-decididos para revisão posterior.

### Agente Paradigm Advisor

**Persona**: "Paradigm Advisor é um agente especializado em identificar paradigmas de programação. Ele detecta o paradigma do sistema legado a partir de suas specs, infere o paradigma natural da stack alvo declarada, alerta sobre gaps que o usuário pode não ter percebido, e força uma decisão consciente sobre como tratá-los. Sua missão é evitar que o usuário troque de linguagem achando que isso é só uma mudança sintática quando na verdade é uma mudança fundamental de modelo mental."

**Inputs**:
- `_reversa_sdd/migration/migration_brief.md` (para extrair stack alvo)
- `_reversa_sdd/domain_model.md`
- `_reversa_sdd/process_flows.md`
- `_reversa_sdd/legacy_inventory.md`
- Skill consultiva: `paradigm_catalog`

**Outputs**:
- `_reversa_sdd/migration/paradigm_decision.md`

**Política de detecção (legado)**:
- Procedural: arquivos com funções top-level, ausência de classes, fluxo linear em controllers.
- OO clássico: hierarquia de classes, herança forte, padrão Active Record.
- OO com DI: containers, interfaces explícitas, padrão Repository/Service.
- Funcional: imutabilidade dominante, funções puras, composição.
- Event-driven: filas/tópicos, handlers desacoplados, ausência de fluxo linear.
- Híbrido: combinações detectadas com evidência de cada parte.

**Política de inferência (alvo)**:
- Consulta `paradigm_catalog` com a stack declarada no brief.
- Catálogo retorna: paradigma natural, paradigmas alternativos viáveis, gaps típicos vindo de cada paradigma de origem.

**Política de apresentação de gap**:
- Se paradigmas iguais → mensagem curta "Sem mudança de paradigma. Confirma?", segue.
- Se paradigmas diferentes → apresenta lista concreta de implicações (não abstrato), com exemplos do próprio sistema legado.
- Sempre apresenta 3 opções: adotar paradigma natural / forçar similar ao legado / híbrido. Cada opção tem seção de "consequências" detalhada.

**Decisão técnica**: Paradigm Advisor é o agente mais opinativo do time. Ele educa o usuário, não apenas coleta resposta. Isso justifica ser o primeiro do time, pois sua decisão molda tudo o que vem depois.

### Agente Curator

**Persona**: "Curator decide o que migra, o que descarta e o que precisa de decisão humana, baseando-se nas specs do legado, no critério do brief e no paradigma escolhido."

**Inputs**:
- `_reversa_sdd/migration/migration_brief.md`
- `_reversa_sdd/migration/paradigm_decision.md`
- `_reversa_sdd/business_rules.md`
- `_reversa_sdd/process_flows.md`
- `_reversa_sdd/pain_points.md`
- `_reversa_sdd/integrations.md`

**Outputs**:
- `_reversa_sdd/migration/target_business_rules.md`
- `_reversa_sdd/migration/discard_log.md`
- Atualização de `_reversa_sdd/migration/ambiguity_log.md`

**Política de decisão**:
- Regras 🟢 + sem conexão com pain points + compatíveis com paradigma alvo → MIGRAR.
- Regras citadas em `pain_points.md` → DECISÃO HUMANA.
- Regras 🟡 INFERIDAS → MIGRAR com aviso para validação.
- Regras 🔴 GAP → DECISÃO HUMANA obrigatória.
- Regras ⚠️ AMBÍGUAS → DECISÃO HUMANA obrigatória.
- Regras incompatíveis com `migration_brief.md` → DESCARTAR com justificativa.
- **Regras que são artefatos do paradigma legado (não do negócio) → DESCARTAR** quando o paradigma muda. Exemplo: lock manual com `SELECT FOR UPDATE` em legado procedural pode ser descartado em alvo event-driven, substituído por idempotência via event ID.

### Agente Strategist

**Persona**: "Strategist propõe estratégias de migração com trade-offs explícitos, baseando-se no brief, no paradigma decidido, no domain model e no que o Curator decidiu migrar. Recomenda uma estratégia mas deixa a escolha como decisão humana."

**Inputs**:
- `migration_brief.md`
- `paradigm_decision.md` (especialmente o `derived_appetite`)
- `_reversa_sdd/domain_model.md`
- `_reversa_sdd/integrations.md`
- `_reversa_sdd/migration/target_business_rules.md`
- Skill consultiva: `migration_strategies`

**Outputs**:
- `_reversa_sdd/migration/migration_strategy.md`
- `_reversa_sdd/migration/risk_register.md`
- `_reversa_sdd/migration/cutover_plan.md`

**Catálogo de estratégias (em skill `migration_strategies`)**:

| Estratégia | Quando aplica | Custo | Risco | Tempo |
|---|---|---|---|---|
| Strangler Fig | Sistema em produção, não pode parar | Médio | Baixo | Longo |
| Big Bang | Sistema pequeno, janela controlada, apetite transformacional | Baixo | Alto | Curto |
| Parallel Run | Lógica crítica (financeiro/fiscal) | Alto | Médio | Médio |
| Branch by Abstraction | Refatoração interna antes da migração, apetite conservador | Baixo | Baixo | Médio |

**Influência do paradigma**:
- Apetite `conservative` → favorece Branch by Abstraction e Strangler Fig.
- Apetite `balanced` → favorece Strangler Fig e Parallel Run.
- Apetite `transformational` → permite Big Bang em sistemas pequenos, Strangler Fig com bordas profundas em sistemas maiores.
- Mudança grande de paradigma + apetite transformacional → Strategist sinaliza explicitamente "alto risco de divergência operacional, recomenda Parallel Run para validação".

### Agente Designer

**Persona**: "Designer desenha as specs do sistema novo a partir do que foi decidido migrar, da estratégia escolhida e do paradigma definido. Produz arquitetura alvo, domain model alvo e plano de migração de dados, mantendo rastreabilidade total para o legado."

**Inputs**:
- `migration_brief.md`
- `paradigm_decision.md`
- `_reversa_sdd/domain_model.md`
- `_reversa_sdd/data_model_legacy.md` (se existir; trata ausência graciosamente)
- `_reversa_sdd/migration/target_business_rules.md`
- `_reversa_sdd/migration/migration_strategy.md` (com estratégia confirmada)

**Outputs**:
- `_reversa_sdd/migration/target_architecture.md` (com Mermaid)
- `_reversa_sdd/migration/target_domain_model.md`
- `_reversa_sdd/migration/target_data_model.md`
- `_reversa_sdd/migration/data_migration_plan.md`

**Princípios embutidos**:
- Bounded contexts a partir de coesão de dados e transações, não de arquivos do legado.
- Decomposição 1-para-1 proibida; agrupamento ou separação devem ser justificados.
- Cada elemento do sistema novo aponta para origem no legado ou para `discard_log.md`.
- Arquitetura **respeita o paradigma escolhido**: event-driven exige eventos explícitos, schemas de mensagem, estratégia de consistência eventual; OO com DI exige interfaces e injeção; funcional exige tipos imutáveis e composição.
- A estratégia escolhida influencia decomposição: Strangler favorece bordas explícitas para substituição incremental; Big Bang permite redesign mais profundo.

### Agente Inspector

**Persona**: "Inspector define como provar que o sistema novo é comportamentalmente equivalente ao legado. Adapta os critérios de paridade ao paradigma escolhido, pois equivalência funcional ingênua não é suficiente quando há mudança de paradigma."

**Inputs**:
- `_reversa_sdd/process_flows.md`
- `_reversa_sdd/characterization_specs/` (se existir)
- `_reversa_sdd/migration/paradigm_decision.md`
- `_reversa_sdd/migration/target_architecture.md`
- `_reversa_sdd/migration/migration_strategy.md`

**Outputs**:
- `_reversa_sdd/migration/parity_specs.md`
- `_reversa_sdd/migration/parity_tests/*.feature`

**Critérios de paridade adaptados ao paradigma**:
- Sem mudança de paradigma → equivalência funcional padrão.
- Síncrono → event-driven → cobertura adicional de: ordem de mensagens, idempotência, consistência eventual, comportamento sob falha de fila.
- Procedural → OO → cobertura de invariantes em aggregates, comportamento de validação em factories.
- OO → funcional → cobertura de imutabilidade, ausência de side effects esperados, equivalência sob composição.

**`parity_specs.md` define**:
- Estratégia geral de validação (shadow mode, characterization, contract, data parity).
- Critérios de "paridade aceita" (ex: índice de divergência < 0.01% por 30 dias).
- Tipos de teste a aplicar, adequados ao paradigma.

### Skills compartilhadas

#### `read_legacy_specs`
Skill que abstrai a leitura de `_reversa_sdd/`. Cada agente declara artefatos requeridos; a skill lê, valida front-matter, retorna estrutura tipada. Trata artefatos opcionais graciosamente.

#### `render_artifact`
Skill que renderiza markdown com front-matter padronizado, tagging de evidência (🟢🟡🔴⚠️), e hash SHA-256 para detecção de modificação manual.

#### `state_checkpoint`
Skill que persiste e lê `_reversa_sdd/migration/.state.json`. Suporta `--resume` e `--regenerate`.

#### `human_decision_gate`
Skill que abstrai pausas para decisão humana. Em Claude Code, escreve `pending_decisions.md` e usa o canal de chat. Em outras engines, comportamento equivalente.

#### `paradigm_catalog` (consultiva)
Skill que cataloga paradigmas comuns de legados e stacks alvo, com gaps típicos entre eles. Usada principalmente pelo Paradigm Advisor.

Conteúdo mínimo:
- Catálogo de paradigmas: procedural, OO clássico, OO com DI, funcional, event-driven, actor model, dataflow.
- Catálogo de stacks → paradigma natural (ex: Node moderno → async/event-driven; Go → CSP/goroutines; Elixir → actor model; Rust → ownership/zero-cost; Python moderno → async opcional).
- Gaps típicos: para cada par (paradigma origem, paradigma destino), lista as implicações que o usuário precisa conhecer.

#### `migration_strategies` (consultiva)
Skill que cataloga estratégias de migração com critérios de aplicabilidade, custo, risco, tempo. Usada pelo Strategist.

## Modelo de dados

### Estrutura após execução completa

```
<projeto>/
└── _reversa_sdd/                          (do time de descoberta)
    ├── ... (artefatos do time de descoberta)
    └── migration/                          (do time de migração)
        ├── migration_brief.md            (RF-03)
        ├── paradigm_decision.md            (Paradigm Advisor)
        ├── target_business_rules.md        (Curator)
        ├── discard_log.md                  (Curator)
        ├── migration_strategy.md           (Strategist)
        ├── risk_register.md                (Strategist)
        ├── cutover_plan.md                 (Strategist)
        ├── target_architecture.md          (Designer)
        ├── target_domain_model.md          (Designer)
        ├── target_data_model.md            (Designer)
        ├── data_migration_plan.md          (Designer)
        ├── parity_specs.md                 (Inspector)
        ├── parity_tests/                   (Inspector)
        │   ├── 01-place-order.feature
        │   └── ...
        ├── ambiguity_log.md                (consolidado)
        ├── handoff.md                      (final)
        ├── pending_decisions.md            (transitório, durante pausas)
        ├── .state.json                     (orquestrador)
        └── .logs/
            └── <timestamp>-migrate.log
```

### Schema do `paradigm_decision.md`

```markdown
---
schemaVersion: 1
generatedAt: 2026-05-02T14:30:00Z
reversa: { version: "x.y.z" }
kind: paradigm_decision
---

# Paradigm Decision

## Paradigma do legado detectado
- **Paradigma principal**: procedural síncrono
- **Evidências**: [...] 🟢 / 🟡 / 🔴 / ⚠️
- **Variações observadas**: [...]

## Stack alvo declarada
- Linguagem: Node.js 20
- Framework: Fastify
- Infra: AWS Lambda

## Paradigma natural inferido
- **Paradigma**: async/event-driven
- **Justificativa**: [...]

## Gap identificado
- **Severidade**: alto / médio / baixo
- **Implicações concretas**:
  - [implicação 1]
  - [implicação 2]
  - [implicação 3]

## Opções apresentadas ao usuário
1. **Adotar paradigma natural da stack** (transformacional)
2. **Forçar paradigma similar ao legado** (conservador)
3. **Híbrido** (equilibrado)

## Decisão do usuário
- **Escolha**: <uma das três>
- **Justificativa do usuário**: <texto livre>

## Apetite derivado
- `derived_appetite`: conservative | balanced | transformational

## Implicações pendentes para próximos agentes
- [implicação 1] → afeta Curator (regras X, Y)
- [implicação 2] → afeta Designer (arquitetura)
- [implicação 3] → afeta Inspector (critérios de paridade)
```

### Schemas dos demais artefatos

Todos os artefatos markdown carregam o mesmo cabeçalho de front-matter, variando apenas no campo `kind` e nas seções de corpo. Cabeçalho comum:

```yaml
---
schemaVersion: 1
generatedAt: <ISO-8601>
reversa: { version: "x.y.z" }
kind: <identificador>
producedBy: <agente ou "orchestrator">
hash: sha256:<hash do corpo abaixo do front-matter>
---
```

Estrutura mínima por artefato (seções obrigatórias):

| Artefato | `kind` | Seções obrigatórias |
|---|---|---|
| `migration_brief.md` | `migration_brief` | Objetivo, Métricas de sucesso, Restrições, Riscos conhecidos, Stakeholders, Stack alvo (linguagem/framework/infra) |
| `paradigm_decision.md` | `paradigm_decision` | (schema detalhado abaixo) |
| `target_business_rules.md` | `target_business_rules` | Resumo de contagem, Regras MIGRAR, Regras DESCARTAR (resumo + ponteiro para `discard_log.md`), Regras DECISÃO HUMANA |
| `discard_log.md` | `discard_log` | Itens descartados (cada um: id, origem, justificativa, vinculado a paradigma sim/não) |
| `migration_strategy.md` | `migration_strategy` | Estratégias avaliadas (≥2), Trade-offs, Estratégia recomendada, Justificativa |
| `risk_register.md` | `risk_register` | Riscos (cada um: descrição, probabilidade, impacto, mitigação, owner) |
| `cutover_plan.md` | `cutover_plan` | Pré-requisitos, Passos do cutover, Janela, Plano de rollback, Critérios de go/no-go |
| `target_architecture.md` | `target_architecture` | Visão geral, Diagrama Mermaid, Componentes, Bounded contexts, Decisões arquiteturais (com rastreabilidade), Honra ao paradigma |
| `target_domain_model.md` | `target_domain_model` | Aggregates, Entidades, Value objects, Eventos (se aplicável), Rastreabilidade para legado |
| `target_data_model.md` | `target_data_model` | Entidades de dados, Relacionamentos, Schema (DDL ou equivalente), Restrições |
| `data_migration_plan.md` | `data_migration_plan` | Mapeamento legado → novo, Transformações, Estratégia de ETL, Cutover de dados, Validação |
| `parity_specs.md` | `parity_specs` | Estratégia geral, Tipos de teste, Critérios de "paridade aceita", Cobertura adaptada ao paradigma |
| `ambiguity_log.md` | `ambiguity_log` | Itens (cada um: id, descrição, agente que detectou, status, decisão se houver) |
| `handoff.md` | `handoff` | Lista de artefatos, Ordem de leitura recomendada (paradigm_decision.md em primeiro), Pendências, Próximos passos para o agente de codificação |
| `pending_decisions.md` | `pending_decisions` | (transitório) Decisões abertas com contexto e opções |

Cada template em `templates/migration/artifacts/` contém placeholders para essas seções e um exemplo mínimo comentado.

### Schema do `.state.json`

```json
{
  "schemaVersion": 1,
  "startedAt": "ISO-8601",
  "lastCheckpoint": "ISO-8601",
  "completedAgents": ["paradigm_advisor", "curator"],
  "pendingAgents": ["strategist", "designer", "inspector"],
  "pendingDecisions": [
    {
      "agent": "strategist",
      "topic": "estrategia_escolhida",
      "options": ["strangler_fig", "parallel_run"],
      "default": "strangler_fig"
    }
  ],
  "artifacts": {
    "paradigm_decision.md": {
      "status": "created",
      "agent": "paradigm_advisor",
      "generatedAt": "ISO-8601",
      "hash": "sha256:..."
    }
  }
}
```

## Fluxo principal

### Fluxo: `/reversa-migrate` (modo padrão interativo)

1. Slash command invocado pelo usuário.
2. `read_legacy_specs` valida `_reversa_sdd/` existe e está completo.
3. Verifica `migration_brief.md`. Se ausente, conduz entrevista; se presente, oferece revisar / manter / recriar.
4. Carrega ou cria `.state.json`.
5. **Paradigm Advisor** invocado. Detecta paradigma legado, infere alvo, identifica gap, apresenta opções, registra escolha em `paradigm_decision.md`.
6. **Pausa**: `human_decision_gate` apresenta resumo do paradigma e confirma antes de prosseguir.
7. **Curator** invocado. Lê inputs incluindo `paradigm_decision.md`. Aplica política de decisão. Gera artefatos.
8. **Pausa**: revisão de itens DECISÃO HUMANA. Cada item é apresentado e usuário decide.
9. **Strategist** invocado. Lê inputs incluindo `paradigm_decision.md`. Consulta catálogo. Gera artefatos com estratégia recomendada.
10. **Pausa**: usuário escolhe estratégia entre as propostas.
11. **Designer** invocado. Lê inputs com estratégia confirmada e paradigma. Gera artefatos.
12. **Pausa**: usuário aprova arquitetura ou pede ajustes (se ajustes, Designer roda de novo com feedback).
13. **Inspector** invocado. Lê inputs com arquitetura aprovada. Gera artefatos com critérios adaptados ao paradigma.
14. Pipeline gera `handoff.md` final.
15. Resumo final no chat, log completo em `.logs/`.

### Fluxo: `--resume`

1. Lê `.state.json`.
2. Identifica agente onde parou.
3. Confirma com usuário antes de retomar.
4. Continua do agente seguinte.

### Fluxo: `--regenerate=<agent>`

1. Confirma com usuário (operação destrutiva).
2. Backup em `.backup-<timestamp>/`.
3. Apaga artefatos do agente especificado e dos posteriores.
4. Roda a partir do agente especificado.

## Casos de borda e tratamento de erros

- **`_reversa_sdd/` não existe**: erro claro com instrução de rodar `/reversa` primeiro.
- **`_reversa_sdd/` incompleto**: lista artefatos faltantes.
- **Stack alvo no brief ausente ou ambígua**: Paradigm Advisor pergunta antes de continuar.
- **Paradigma legado híbrido detectado**: Paradigm Advisor explicita os componentes e pede decisão sobre cada um.
- **Engine sem TTY interativo**: `human_decision_gate` cai para modo "escreve `pending_decisions.md` e pausa".
- **Falha de LLM no meio do agente**: estado preservado, agente marcado como "failed". `--resume` reexecuta.
- **Conflito de versão de `_reversa_sdd/`**: front-matter `schemaVersion` checado.
- **`migration_brief.md` ou `paradigm_decision.md` corrompidos**: oferece recriar.
- **Modificação manual de artefato gerado**: hash em `.state.json` detecta divergência. Comportamento: pipeline pausa, apresenta diff resumido (linhas adicionadas/removidas), e pede ao usuário entre 3 opções: (a) preservar versão modificada manualmente e abortar regeneração, (b) sobrescrever (com backup automático em `.backup-<timestamp>/`), (c) abortar pipeline para inspeção manual. `--auto` adota (a) por padrão para nunca destruir trabalho humano sem confirmação.

## Dependências externas

Nenhuma dependência nova além das já existentes no Reversa. Todo o módulo é puro markdown + skills + agent prompts no formato nativo da engine.

## Alternativas consideradas e descartadas

- **Pipeline imperativo em Node.js**: descartado, pois Reversa é declarativo, executado pela engine.
- **Agente único megagent**: descartado, pois 5 agentes especializados produzem artefatos mais consistentes e debugáveis.
- **4 agentes (sem Paradigm Advisor)**: descartado, pois paradigma é decisão crítica que não pode ser sub-passo do command nem responsabilidade distribuída.
- **Paradigm Advisor depois do Curator**: descartado, pois paradigma molda inclusive o que conta como regra migrável.
- **Apetite como pergunta separada**: descartado, pois redundante com paradigma e gera incoerências.
- **Modo automático sem pausas como default**: descartado, pois migração é decisão humana com auxílio de IA.
- **Geração de testes executáveis**: descartado, pois Reversa gera specs, não código.

## Considerações por engine

| Engine | Agentes em | Slash command em |
|---|---|---|
| Claude Code | `.claude/agents/migration/` | `.claude/commands/reversa-migrate.md` |
| Cursor | `.cursor/rules/migration/` | comando customizado |
| Codex | configuração nativa | configuração nativa |
| Antigravity | spec-driven workflow | comando nativo |

A semântica é a mesma; o formato muda. Adaptadores reusam o que já existe para o time de descoberta.

## Considerações de testabilidade

- Cada agente tem fixture mínima de `_reversa_sdd/` para teste isolado.
- Política de decisão do Curator é testável determinísticamente.
- Catálogos (`paradigm_catalog`, `migration_strategies`) são testáveis como tabelas.
- Paradigm Advisor é o agente menos determinístico no aspecto de detecção; testes verificam restrições mínimas: detecção correta em fixtures conhecidas, apresentação de gap quando paradigmas diferem, registro completo em `paradigm_decision.md`.
- Designer é testado por restrições estruturais: rastreabilidade existe, decomposição não é 1-para-1, diagrama Mermaid é válido, arquitetura honra o paradigma escolhido.
- Inspector é testado por validação de schema dos `.feature` e adequação dos critérios ao paradigma.
