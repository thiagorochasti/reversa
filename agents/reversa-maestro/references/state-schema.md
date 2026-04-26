# Schema — .reversa/state.json

Este arquivo persiste o estado completo da análise entre sessões. O Maestro lê e escreve neste arquivo.

## Estrutura completa

```json
{
  "version": "1.0.0",
  "project": "nome-do-projeto",
  "user_name": "Nome do Usuário",
  "chat_language": "pt-br",
  "doc_language": "pt-br",
  "phase": "reconhecimento",
  "completed": ["reconhecimento"],
  "pending": ["escavacao", "interpretacao", "geracao", "revisao"],
  "checkpoints": {
    "scout": {
      "completed_at": "2026-04-26T10:00:00Z",
      "files": [
        "_reversa_sdd/inventory.md",
        "_reversa_sdd/dependencies.md",
        ".reversa/context/surface.json"
      ]
    },
    "arqueologo": {
      "completed_at": "2026-04-26T11:00:00Z",
      "modules_analyzed": ["auth", "orders", "payments"],
      "files": [
        "_reversa_sdd/code-analysis.md",
        "_reversa_sdd/data-dictionary.md",
        ".reversa/context/modules.json"
      ]
    }
  },
  "created_files": [
    "CLAUDE.md",
    ".agents/skills/reversa-maestro/SKILL.md",
    ".reversa/state.json",
    ".reversa/plan.md"
  ]
}
```

## Campos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `version` | string | Versão do Reversa instalada |
| `project` | string | Nome do projeto legado |
| `user_name` | string | Nome do usuário (para interações) |
| `chat_language` | string | Idioma das interações (ex: pt-br, en-us) |
| `doc_language` | string | Idioma das specs geradas (ex: Português, English) |
| `phase` | string \| null | Fase atual. `null` = não iniciado |
| `completed` | string[] | Fases concluídas |
| `pending` | string[] | Fases pendentes |
| `checkpoints` | object | Registro de conclusão de cada agente |
| `created_files` | string[] | Todos os arquivos criados pelo Reversa (para uninstall seguro) |

## Fases válidas

`reconhecimento` → `escavacao` → `interpretacao` → `geracao` → `revisao`

## Regra ao escrever

Nunca remova campos existentes. Apenas adicione ou atualize.
