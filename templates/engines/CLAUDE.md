# Reversa

> Framework de Engenharia Reversa instalado neste projeto.

## Como usar

Digite `/reversa` para ativar o Maestro e iniciar ou retomar a análise do projeto.

## Comportamento ao ativar

Quando o usuário digitar `/reversa` ou a palavra `reversa` sozinha em uma mensagem:

1. Ative o skill `reversa-maestro` disponível em `.claude/skills/reversa-maestro/SKILL.md`
2. Se não encontrar em `.claude/skills/`, tente `.agents/skills/reversa-maestro/SKILL.md`
3. Leia o SKILL.md na íntegra e siga exatamente as instruções do Maestro

## Regra não-negociável

Nunca apague, modifique ou sobrescreva arquivos pré-existentes do projeto legado.
O Reversa escreve **apenas** em `.reversa/` e `_reversa_sdd/`.
