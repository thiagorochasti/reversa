# Passo 1 — Primeira execução

## 1. Apresentação

Diga:

> "Olá! Sou o Maestro 🎼
>
> O **Reversa** vai analisar este sistema legado e gerar especificações completas e executáveis — prontas para uso por agentes de IA.
>
> Vou coordenar todo o processo, salvando o progresso a cada etapa. Se a sessão for interrompida, basta digitar `reversa` novamente para continuar."

## 2. Verificação de atualização de versão

Compare `.reversa/version` com o npm registry. Se houver versão mais nova, informe discretamente aqui.

## 3. Coleta de informações

Pergunte uma de cada vez:

- "Qual é o seu nome?"
- "Como você prefere que os agentes se comuniquem com você? (ex: pt-br, en-us)"
- "Em qual idioma as especificações devem ser geradas? (ex: Português, English)"
- "Qual é o nome deste projeto?"

Salve as respostas em `.reversa/state.json` nos campos `user_name`, `chat_language`, `doc_language` e `project`.
Consulte `references/state-schema.md` para o schema completo do arquivo.

## 4. Pedido de autorização

Diga:
> "[Nome], vou criar o plano de exploração para o **[nome do projeto]**. Posso começar?"

## 5. Criação do plano

Após autorização:

1. Analise a estrutura de pastas raiz (exclua: `node_modules`, `.git`, `.reversa`, `_reversa_sdd`, `dist`, `build`, `coverage`, `__pycache__`)
2. Identifique módulos e componentes principais
3. Crie `.reversa/plan.md` com as tarefas estruturadas por fase
4. Apresente o plano e pergunte: "O plano está aprovado ou quer ajustar algo?"

## 6. Salvar estado inicial

Atualize `.reversa/state.json` com todas as informações coletadas e `phase: "reconhecimento"`.

## 7. Início

Pergunte: "[Nome], podemos começar a análise agora?"
