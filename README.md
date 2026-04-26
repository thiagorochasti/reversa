# Reversa

**Transforme sistemas legados em especificações executáveis por agentes de IA.**

O Reversa é um framework de engenharia reversa de especificações. Ele se instala dentro do seu projeto legado e coordena agentes de IA especializados para analisar o código existente e gerar especificações completas, rastreáveis e prontas para uso por qualquer agente codificador.

> **Status do projeto:** Os agentes e a arquitetura de skills estão completos e prontos para uso.
> O instalador CLI (`npx reversa install`) está em desenvolvimento ativo — por enquanto, siga o [guia de instalação manual](#instalação-manual) abaixo.

---

## Por que o Reversa existe

Agentes de IA são excelentes para criar software novo a partir de especificações. O problema é que a maioria dos projetos reais não tem especificações — o conhecimento está no código, nos commits, na cabeça das pessoas.

O Reversa inverte esse fluxo: parte do código existente para gerar as specs. O resultado é um conjunto de documentos que qualquer agente de IA pode usar para entender, evoluir, refatorar ou reimplementar o sistema com fidelidade.

---

## Como funciona

O Reversa usa um pipeline de 5 fases orquestradas pelo **Maestro**, que coordena os agentes especializados:

```
Reconhecimento → Escavação → Interpretação → Geração → Revisão
    Scout         Arqueólogo    Detetive       Redator    Advogado
                               Arquiteto
```

Agentes independentes (rodam em qualquer fase): **Visor**, **Data Master**, **Design System**, **Tracer**

Todo o progresso é salvo em `.reversa/state.json` a cada checkpoint — se a sessão for interrompida, basta digitar `reversa` para retomar de onde parou.

---

## Instalação manual

Enquanto o instalador CLI está em desenvolvimento, copie os arquivos manualmente:

**1. Crie a estrutura no seu projeto:**

```bash
mkdir -p .agents/skills .reversa/context
```

**2. Copie os agentes:**

```bash
# Clone o repositório do Reversa
git clone https://github.com/sandeco/reversa.git /tmp/reversa

# Copie os skills para o seu projeto
cp -r /tmp/reversa/agents/reversa-* .agents/skills/

# Para Claude Code, faça o mirror em .claude/skills/
mkdir -p .claude/skills
cp -r /tmp/reversa/agents/reversa-* .claude/skills/
```

**3. Crie os arquivos de configuração:**

```bash
# state.json
cp /tmp/reversa/templates/state.json .reversa/state.json

# plan.md
cp /tmp/reversa/templates/plan.md .reversa/plan.md

# config.toml
cp /tmp/reversa/templates/config.toml .reversa/config.toml
```

**4. Adicione o arquivo de entrada para sua engine:**

```bash
# Claude Code
cat /tmp/reversa/templates/engines/CLAUDE.md >> CLAUDE.md  # ou crie novo

# Codex
cat /tmp/reversa/templates/engines/AGENTS.md >> AGENTS.md

# Cursor
cat /tmp/reversa/templates/engines/cursorrules >> .cursorrules
```

**Requisitos:** Node.js 18+ (para o CLI quando disponível). Nenhuma dependência para uso manual.

> O Reversa **nunca apaga ou modifica** arquivos existentes no seu projeto. Os agentes escrevem apenas em `.reversa/` e `_reversa_sdd/`.

---

## Instalação via CLI (em desenvolvimento)

```bash
npx reversa install
```

O instalador vai:
1. Detectar as engines de IA presentes no ambiente
2. Perguntar quais agentes instalar (todos selecionados por padrão)
3. Configurar os arquivos de entrada para cada engine escolhida
4. Criar a estrutura `.reversa/` no seu projeto

---

## Como usar

Após a instalação, abra o seu projeto no agente de IA preferido e digite:

```
/reversa
```

O Maestro vai se apresentar, criar um plano de exploração personalizado para o seu projeto e coordenar toda a análise.

Em engines sem suporte a slash commands (como Codex), use apenas:

```
reversa
```

---

## Agentes

### Obrigatórios

| Agente | Skill | Função |
|--------|-------|--------|
| **Maestro** | `reversa-maestro` | Orquestrador central. Coordena todos os agentes, salva checkpoints e guia o usuário |
| **Scout** | `reversa-scout` | Mapeia a superfície do projeto: estrutura, tecnologias, frameworks, dependências e entry points |
| **Arqueólogo** | `reversa-arqueologo` | Análise profunda módulo a módulo: algoritmos, fluxos de controle, estruturas de dados |
| **Detetive** | `reversa-detetive` | Extrai o conhecimento de negócio implícito: regras, ADRs retroativos, máquinas de estado, permissões |
| **Arquiteto** | `reversa-arquiteto` | Sintetiza tudo em diagramas C4, ERD completo, mapa de integrações e dívidas técnicas |
| **Redator** | `reversa-redator` | Gera as especificações como contratos operacionais com rastreabilidade de código |

### Opcionais (instalados por padrão, podem ser desmarcados)

| Agente | Skill | Função |
|--------|-------|--------|
| **Advogado do Diabo** | `reversa-advogado` | Revisa as specs, encontra inconsistências e gera perguntas para o usuário validar lacunas |
| **Tracer** | `reversa-tracer` | Análise dinâmica: resolve lacunas via logs, tracing em execução e dados reais (somente leitura) |
| **Visor** | `reversa-visor` | Documenta a interface a partir de screenshots — sem precisar que o sistema esteja rodando |
| **Data Master** | `reversa-data-master` | Análise completa do banco: DDL, migrations, ORM, ERD, triggers, procedures |
| **Design System** | `reversa-design-system` | Extrai tokens de design: cores, tipografia, espaçamentos, temas e componentes |

---

## O que é gerado

```
_reversa_sdd/
├── inventory.md              # Inventário do projeto
├── dependencies.md           # Dependências com versões
├── code-analysis.md          # Análise técnica por módulo
├── data-dictionary.md        # Dicionário de dados
├── domain.md                 # Glossário e regras de negócio
├── state-machines.md         # Máquinas de estado em Mermaid
├── permissions.md            # Matriz de permissões
├── architecture.md           # Visão arquitetural
├── c4-context.md             # Diagrama C4 — Contexto
├── c4-containers.md          # Diagrama C4 — Containers
├── c4-components.md          # Diagrama C4 — Componentes
├── erd-complete.md           # ERD completo em Mermaid
├── confidence-report.md      # Relatório de confiança
├── gaps.md                   # Lacunas identificadas
├── questions.md              # Perguntas para validação humana
├── sdd/                      # Specs por componente
│   └── [componente].md
├── openapi/                  # Specs de API
├── user-stories/             # User stories
├── adrs/                     # Decisões arquiteturais retroativas
├── flowcharts/               # Fluxogramas em Mermaid
├── sequences/                # Diagramas de sequência
├── ui/                       # Specs de interface (Visor)
├── database/                 # Specs de banco de dados (Data Master)
├── design-system/            # Tokens de design (Design System)
└── traceability/
    ├── spec-impact-matrix.md # Qual spec impacta qual
    └── code-spec-matrix.md   # Arquivo de código → spec
```

### Escala de confiança

Toda afirmação gerada pelo Reversa é marcada com:

| Marcação | Significado |
|----------|-------------|
| 🟢 CONFIRMADO | Extraído diretamente do código, sem inferência |
| 🟡 INFERIDO | Baseado em padrões — pode estar errado |
| 🔴 LACUNA | Não determinável, requer validação humana |

---

## Engines suportadas

| Engine | Arquivo criado | Skill path | Comando |
|--------|---------------|-----------|---------|
| Claude Code | `CLAUDE.md` + `.claude/skills/` | `.claude/skills/reversa-*/` | `/reversa` |
| Gemini CLI | `GEMINI.md` | `.agents/skills/reversa-*/` | `/reversa` |
| Cursor | `.cursorrules` | `.agents/skills/reversa-*/` | `/reversa` |
| Windsurf | `.windsurfrules` | `.agents/skills/reversa-*/` | `/reversa` |
| Codex CLI | `AGENTS.md` | `.agents/skills/reversa-*/` | `reversa` |
| VS Code Copilot | — | `.agents/skills/reversa-*/` | `reversa` |
| Outros | Configuração manual | `.agents/skills/reversa-*/` | `reversa` |

---

## Estrutura interna

```
.reversa/
├── state.json          # Estado da análise entre sessões
├── config.toml         # Configuração do projeto
├── config.user.toml    # Configurações pessoais (não commitar)
├── plan.md             # Plano de exploração (editável)
├── version             # Versão instalada
└── context/            # Dados intermediários entre agentes
    ├── surface.json    # Gerado pelo Scout
    └── modules.json    # Gerado pelo Arqueólogo

.agents/skills/         # Skills padrão (todos os agentes compatíveis)
    reversa-maestro/
    reversa-scout/
    ...

.claude/skills/         # Mirror para Claude Code
    reversa-maestro/
    reversa-scout/
    ...
```

---

## Comandos CLI

```bash
npx reversa status       # Mostra o estado atual da análise
npx reversa install      # Instala o Reversa no projeto (em desenvolvimento)
npx reversa update       # Atualiza os agentes para a versão mais recente
npx reversa add-agent    # Adiciona um agente ao projeto
npx reversa add-engine   # Adiciona suporte a uma engine
npx reversa uninstall    # Remove o Reversa do projeto
```

---

## Contribuindo

Contribuições são bem-vindas. Abra uma issue para discutir a mudança antes de enviar um PR.

```bash
git clone https://github.com/sandeco/reversa.git
cd reversa
npm install
```

---

## Licença

MIT — veja [LICENSE](LICENSE) para detalhes.
