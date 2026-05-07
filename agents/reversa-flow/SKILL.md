---
name: reversa-flow
description: Executa o pipeline completo do Reversa como um fluxo automatizado. Use para rodar todas as fases de engenharia reversa sequencialmente sem intervenção manual entre etapas. Ideal para sessões longas ou quando o plano já está aprovado.
type: flow
license: MIT
compatibility: Kimi Code CLI (flow skills), Claude Code, Codex, Cursor e demais agentes compatíveis.
metadata:
  author: thiagorochasti
  version: "1.0.0"
  framework: reversa
  role: orchestrator
---

# Reversa Flow — Pipeline Automatizado

Execute o pipeline completo de engenharia reversa seguindo o diagrama abaixo.

```mermaid
flowchart TD
    A([BEGIN]) --> B[Reversa: saudação e verificação de estado]
    B --> C{State existe e tem plano?}
    C -->|Não| D[Criar plano e perguntar aprovação]
    D --> E{Plano aprovado?}
    E -->|Não| D
    E -->|Sim| F
    C -->|Sim| F[Scout: mapear superfície]
    F --> G{Doc level escolhido?}
    G -->|Não| H[Perguntar nível de documentação]
    H --> I{Organização das specs decidida?}
    I -->|Não| J[Perguntar granularidade]
    J --> K[Archaeologist: análise por módulo]
    G -->|Sim| I
    I -->|Sim| K
    K --> L{Módulos pendentes?}
    L -->|Sim| K
    L -->|Não| M[Detective: extrair regras de negócio]
    M --> N[Architect: diagramas C4 + ERD]
    N --> O[Writer: gerar specs por unit]
    O --> P{Specs pendentes?}
    P -->|Sim| O
    P -->|Não| Q[Reviewer: validar gaps e inconsistências]
    Q --> R{Revisão aprovada?}
    R -->|Não| S[Listar ajustes necessários]
    S --> Q
    R -->|Sim| T[Salvar checkpoint final]
    T --> U([END])
```

## Instruções por nó

### A → B: Reversa
Leia `.reversa/state.json`. Se não existir, execute o passo de primeira execução (coletar nome, idioma, criar plano).

### B → C: Verificação de estado
Se `phase` for `null`, o projeto ainda não começou. Pergunte aprovação do plano.

### C → D: Criar plano
Analise a estrutura de pastas raiz, identifique módulos principais e crie `.reversa/plan.md`.

### D → E: Aprovação
Apresente o plano e pergunte: "O plano está aprovado?" Se não, ajuste.

### F: Scout
Ative `reversa-scout`. Gere `inventory.md`, `dependencies.md` e `surface.json`.

### G → H: Nível de documentação
Se `doc_level` não estiver definido, apresente as 3 opções (Essencial, Completo, Detalhado) e salve a resposta.

### I → J: Organização das specs
Se `[specs]` do `config.toml` estiver vazio, apresente as 6 opções de granularidade e salve.

### K: Archaeologist
Para cada módulo em `surface.json.modules`, ative `reversa-archaeologist`. Salve checkpoint após cada módulo.

### L: Loop de módulos
Continue até `modules_pending` estar vazio.

### M: Detective
Ative `reversa-detective`. Gere regras de negócio, state machines, permissões.

### N: Architect
Ative `reversa-architect`. Gere C4 diagrams, ERD, mapa de integração.

### O: Writer
Para cada unit definida em `[specs]`, ative `reversa-writer`. Gere `requirements.md`, `design.md`, `tasks.md`.

### P: Loop de specs
Continue até todas as units estarem geradas.

### Q: Reviewer
Ative `reversa-reviewer`. Valide gaps, inconsistências e matriz de rastreabilidade.

### R → S: Ajustes
Se o Reviewer encontrar problemas, liste-os e retorne ao Writer ou Detective conforme necessário.

### T: Checkpoint final
Salve `.reversa/state.json` com `phase: null` e `completed: [todas as fases]`.

## Regra não-negociável
Nunca apague, modifique ou sobrescreva arquivos pré-existentes do projeto legado.
O Reversa escreve **apenas** em `.reversa/` e `_reversa_sdd/`.
