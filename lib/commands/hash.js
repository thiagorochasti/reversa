import { createHash } from 'crypto';
import { readFileSync, writeFileSync, existsSync, statSync, readdirSync } from 'fs';
import { join, resolve, relative } from 'path';
import { readJsonSafe } from '../utils/json-safe.js';

const EXCLUDES = [
  'node_modules', '.git', '.reversa', '_reversa_sdd', '_reversa_forward',
  'dist', 'build', 'coverage', '__pycache__', '.cache', '.next', '.nuxt',
  'out', 'target', 'vendor', 'bin', 'obj', '.vs', '.idea', '.vscode',
  'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb',
];

function shouldExclude(name) {
  return EXCLUDES.some(e => name === e || name.startsWith(e + '/') || name.includes('/' + e + '/'));
}

function hashFile(path) {
  const content = readFileSync(path);
  return createHash('sha256').update(content).digest('hex');
}

function walkDir(dir, projectRoot, files = []) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    const relPath = relative(projectRoot, fullPath).replace(/\\/g, '/');
    if (shouldExclude(relPath)) continue;
    if (entry.isDirectory()) {
      walkDir(fullPath, projectRoot, files);
    } else {
      try {
        const hash = hashFile(fullPath);
        files.push({ path: relPath, hash });
      } catch { /* ignore unreadable files */ }
    }
  }
  return files;
}

export default async function hashCommand() {
  const { default: chalk } = await import('chalk');
  const projectRoot = resolve(process.cwd());
  const statePath = join(projectRoot, '.reversa', 'state.json');

  if (!existsSync(statePath)) {
    console.log(chalk.yellow('  Reversa não está instalado neste diretório.'));
    console.log('  Execute ' + chalk.bold('npx reversa install') + ' primeiro.\n');
    return;
  }

  console.log(chalk.bold('\n  Reversa: Cache Hash\n'));
  console.log('  Calculando hashes dos arquivos do projeto...');

  const files = walkDir(projectRoot, projectRoot);
  const state = readJsonSafe(statePath);
  const previousHashes = state.file_hashes ?? {};
  const currentHashes = {};
  let changed = 0;
  let unchanged = 0;
  let added = 0;
  let removed = 0;

  for (const { path, hash } of files) {
    currentHashes[path] = hash;
    if (!previousHashes[path]) {
      added++;
    } else if (previousHashes[path] !== hash) {
      changed++;
    } else {
      unchanged++;
    }
  }

  for (const path of Object.keys(previousHashes)) {
    if (!currentHashes[path]) {
      removed++;
    }
  }

  state.file_hashes = currentHashes;
  state.file_hashes_updated_at = new Date().toISOString();
  writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf8');

  console.log(chalk.green(`  ✓ ${files.length} arquivos indexados`));
  console.log(`    ${chalk.green(String(unchanged))} inalterados`);
  if (changed) console.log(`    ${chalk.yellow(String(changed))} modificados`);
  if (added) console.log(`    ${chalk.cyan(String(added))} novos`);
  if (removed) console.log(`    ${chalk.red(String(removed))} removidos`);
  console.log('');

  if (changed === 0 && added === 0 && removed === 0 && Object.keys(previousHashes).length > 0) {
    console.log(chalk.hex('#ffa203')('  💡 Nenhuma mudança detectada desde a última análise.'));
    console.log('     Os agentes podem pular análises desnecessárias.\n');
  }
}
