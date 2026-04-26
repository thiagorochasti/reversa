import inquirer from 'inquirer';

const REQUIRED_AGENTS = [
  { name: 'Reversa — ponto de entrada principal (obrigatório)', value: 'reversa', disabled: 'obrigatório' },
  { name: 'Maestro — orquestrador central (obrigatório)', value: 'reversa-maestro', disabled: 'obrigatório' },
  { name: 'Scout — reconhecimento (obrigatório)', value: 'reversa-scout', disabled: 'obrigatório' },
  { name: 'Arqueólogo — escavação (obrigatório)', value: 'reversa-arqueologo', disabled: 'obrigatório' },
  { name: 'Detetive — interpretação (obrigatório)', value: 'reversa-detetive', disabled: 'obrigatório' },
  { name: 'Arquiteto — síntese arquitetural (obrigatório)', value: 'reversa-arquiteto', disabled: 'obrigatório' },
  { name: 'Redator — geração de specs (obrigatório)', value: 'reversa-redator', disabled: 'obrigatório' },
];

const OPTIONAL_AGENTS = [
  { name: 'Revisor — revisão e validação das specs', value: 'reversa-revisor', checked: true },
  { name: 'Tracer — análise dinâmica (requer sistema rodando)', value: 'reversa-tracer', checked: true },
  { name: 'Visor — análise de interface via screenshots', value: 'reversa-visor', checked: true },
  { name: 'Data Master — análise de banco de dados', value: 'reversa-data-master', checked: true },
  { name: 'Design System — tokens de design e temas', value: 'reversa-design-system', checked: true },
];

export async function runInstallPrompts(detectedEngines) {
  const engineChoices = detectedEngines.map(e => ({
    name: `${e.name}${e.star ? ' ⭐' : ''}`,
    value: e.id,
    checked: e.detected,
  }));

  const answers = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'engines',
      message: 'Quais engines você quer suportar?',
      choices: engineChoices,
      validate: (selected) => selected.length > 0 || 'Selecione ao menos uma engine.',
    },
    {
      type: 'checkbox',
      name: 'optional_agents',
      message: 'Agentes a instalar:',
      choices: [...REQUIRED_AGENTS, new inquirer.Separator(), ...OPTIONAL_AGENTS],
    },
    {
      type: 'input',
      name: 'project_name',
      message: 'Nome deste projeto:',
      default: process.cwd().split(/[\\/]/).pop(),
      validate: (v) => v.trim().length > 0 || 'Nome não pode ser vazio.',
    },
    {
      type: 'input',
      name: 'user_name',
      message: 'Como os agentes devem te chamar?',
      validate: (v) => v.trim().length > 0 || 'Nome não pode ser vazio.',
    },
    {
      type: 'input',
      name: 'chat_language',
      message: 'Idioma para as interações com os agentes:',
      default: 'pt-br',
    },
    {
      type: 'input',
      name: 'doc_language',
      message: 'Idioma dos documentos e especificações gerados:',
      default: 'Português',
    },
    {
      type: 'input',
      name: 'output_folder',
      message: 'Pasta de saída para as especificações:',
      default: '_reversa_sdd',
    },
    {
      type: 'list',
      name: 'git_strategy',
      message: 'Como tratar os artefatos no git?',
      choices: [
        { name: 'Commitar junto com o projeto (recomendado para equipes)', value: 'commit' },
        { name: 'Adicionar ao .gitignore (uso pessoal)', value: 'gitignore' },
      ],
    },
    {
      type: 'list',
      name: 'answer_mode',
      message: 'Como você prefere responder às perguntas dos agentes?',
      choices: [
        { name: 'No chat (mais rápido)', value: 'chat' },
        { name: 'No arquivo questions.md (mais organizado)', value: 'file' },
      ],
    },
  ]);

  const requiredAgentValues = REQUIRED_AGENTS.map(a => a.value);
  return {
    ...answers,
    agents: [...requiredAgentValues, ...answers.optional_agents],
  };
}

export async function askMergeStrategy(filePath) {
  const { strategy } = await inquirer.prompt([
    {
      type: 'list',
      name: 'strategy',
      message: `O arquivo "${filePath}" já existe. O que fazer?`,
      choices: [
        { name: 'Mesclar — adicionar conteúdo do Reversa ao final', value: 'merge' },
        { name: 'Pular — manter o arquivo como está', value: 'skip' },
      ],
    },
  ]);
  return strategy;
}
