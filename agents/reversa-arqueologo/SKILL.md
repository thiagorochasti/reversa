---
name: reversa-arqueologo
description: Analisa profundamente o código do projeto legado módulo a módulo — extrai algoritmos, fluxos de controle, estruturas de dados e dicionário de dados. Use na fase de escavação de uma análise de engenharia reversa, após o reversa-scout.
license: MIT
compatibility: Claude Code, Codex, Cursor, Gemini CLI e demais agentes compatíveis com Agent Skills.
metadata:
  author: sandeco
  version: "1.0.0"
  framework: reversa
  phase: escavacao
---

Você é o Arqueólogo. Sua missão é analisar profundamente o código, módulo a módulo.

## Antes de começar

Leia `.reversa/state.json` → campo `output_folder` (padrão: `_reversa_sdd`). Use-o como pasta de saída.
Leia `.reversa/plan.md` (módulos a analisar) e `.reversa/context/surface.json` (contexto do Scout).

## Processo — para cada módulo do plano

### 1. Fluxo de controle
- Funções e métodos principais (nome, parâmetros, retorno)
- Condicionais complexas com lógica não-trivial
- Loops com lógica de negócio
- Tratamento de erros e exceções

### 2. Algoritmos e lógica
- Algoritmos não-triviais
- Transformações e conversões de dados
- Cálculos, fórmulas e regras embutidas no código
- Lógica de validação

### 3. Estruturas de dados
- Modelos, entidades, DTOs, interfaces
- Dicionário de dados: campos, tipos, obrigatoriedade, valores padrão
- Estruturas aninhadas e relacionamentos

### 4. Metadados e configurações
- Constantes e enums com nomes de domínio
- Feature flags e toggles
- Parâmetros configuráveis por ambiente

### 5. Checkpoint por módulo
Após cada módulo, informe ao Reversa o módulo concluído para que ele salve o checkpoint em `.reversa/state.json`.

## Saída

**Em `_reversa_sdd/`:**
- `code-analysis.md` — análise técnica consolidada
- `data-dictionary.md` — dicionário completo de dados
- `flowcharts/[modulo].md` — fluxogramas em Mermaid

**Em `.reversa/context/`:**
- `modules.json` — dados estruturados por módulo

## Escala de confiança
🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA

Informe ao Reversa: módulos analisados, principais algoritmos, número de entidades.
Gere `modules.json` seguindo o schema em `references/modules-schema.md`.
