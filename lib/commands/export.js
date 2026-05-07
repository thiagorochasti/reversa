import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { readJsonSafe } from '../utils/json-safe.js';

function parseMarkdown(md) {
  const lines = md.split('\n');
  const result = {
    title: '',
    sections: [],
    tables: [],
    mermaid: [],
    confidence: [],
  };

  let currentSection = null;
  let inTable = false;
  let tableHeaders = [];
  let tableRows = [];
  let inMermaid = false;
  let mermaidContent = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Title
    if (trimmed.startsWith('# ')) {
      result.title = trimmed.replace('# ', '').trim();
      continue;
    }

    // Sections
    if (trimmed.startsWith('## ')) {
      if (currentSection) {
        result.sections.push(currentSection);
      }
      currentSection = {
        heading: trimmed.replace('## ', '').trim(),
        content: [],
      };
      continue;
    }
    if (trimmed.startsWith('### ')) {
      if (currentSection) {
        result.sections.push(currentSection);
      }
      currentSection = {
        heading: trimmed.replace('### ', '').trim(),
        content: [],
      };
      continue;
    }

    // Mermaid
    if (trimmed === '```mermaid') {
      inMermaid = true;
      mermaidContent = [];
      continue;
    }
    if (inMermaid && trimmed === '```') {
      inMermaid = false;
      result.mermaid.push(mermaidContent.join('\n'));
      continue;
    }
    if (inMermaid) {
      mermaidContent.push(line);
      continue;
    }

    // Tables
    if (trimmed.startsWith('|')) {
      const cells = trimmed.split('|').map(c => c.trim()).filter(c => c);
      if (cells.every(c => c.match(/^[-:]+$/))) {
        inTable = true;
        continue;
      }
      if (!inTable) {
        tableHeaders = cells;
        inTable = true;
      } else {
        const row = {};
        cells.forEach((c, i) => {
          row[tableHeaders[i] || `col${i}`] = c;
        });
        tableRows.push(row);
      }
      continue;
    } else if (inTable) {
      result.tables.push({ headers: tableHeaders, rows: tableRows });
      inTable = false;
      tableHeaders = [];
      tableRows = [];
    }

    // Confidence scale
    if (trimmed.match(/^[🟢🟡🔴]/)) {
      result.confidence.push(trimmed);
    }

    if (currentSection) {
      currentSection.content.push(line);
    }
  }

  if (currentSection) {
    result.sections.push(currentSection);
  }
  if (inTable) {
    result.tables.push({ headers: tableHeaders, rows: tableRows });
  }

  return result;
}

function walkOutputDir(dir, files = []) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkOutputDir(full, files);
    } else if (entry.name.endsWith('.md')) {
      files.push(full);
    }
  }
  return files;
}

export default async function exportCommand(args) {
  const { default: chalk } = await import('chalk');
  const { default: yaml } = await import('yaml');

  const format = args.find(a => a.startsWith('--format='))?.split('=')[1] || 'json';
  const outputArg = args.find(a => a.startsWith('--output='))?.split('=')[1];

  if (!['json', 'yaml'].includes(format)) {
    console.error(chalk.red(`\n  Formato inválido: "${format}"`));
    console.error('  Use: --format=json ou --format=yaml\n');
    process.exit(1);
  }

  const projectRoot = resolve(process.cwd());
  const statePath = join(projectRoot, '.reversa', 'state.json');

  if (!existsSync(statePath)) {
    console.log(chalk.yellow('  Reversa não está instalado neste diretório.'));
    console.log('  Execute ' + chalk.bold('npx reversa install') + ' primeiro.\n');
    return;
  }

  const state = readJsonSafe(statePath);
  const outputFolder = state.output_folder || '_reversa_sdd';
  const outputDir = join(projectRoot, outputFolder);

  if (!existsSync(outputDir)) {
    console.log(chalk.yellow(`  Pasta de saída não encontrada: ${outputFolder}/`));
    console.log('  Execute o Reversa primeiro para gerar as specs.\n');
    return;
  }

  console.log(chalk.bold(`\n  Reversa: Exportar specs (${format.toUpperCase()})\n`));

  const mdFiles = walkOutputDir(outputDir);
  const specs = {
    meta: {
      project: state.project || '',
      exported_at: new Date().toISOString(),
      format,
      source_files: mdFiles.length,
    },
    artifacts: {},
  };

  for (const file of mdFiles) {
    const rel = file.replace(outputDir + '\\', '').replace(outputDir + '/', '').replace(/\\/g, '/');
    const md = readFileSync(file, 'utf8');
    const parsed = parseMarkdown(md);
    specs.artifacts[rel] = parsed;
  }

  const outputFile = outputArg || join(projectRoot, `${outputFolder}.${format}`);
  const content = format === 'json'
    ? JSON.stringify(specs, null, 2)
    : yaml.stringify(specs);

  writeFileSync(outputFile, content, 'utf8');

  console.log(chalk.green(`  ✓ ${mdFiles.length} arquivos exportados`));
  console.log(`    → ${outputFile}\n`);
}
