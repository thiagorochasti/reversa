import { createHash } from 'crypto';
import { readFileSync, existsSync, writeFileSync, mkdirSync, statSync } from 'fs';
import { join, dirname } from 'path';

export function hashFile(filePath) {
  if (!existsSync(filePath)) return null;
  if (statSync(filePath).isDirectory()) return null;
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

export function buildManifest(files) {
  const manifest = {};
  for (const file of files) {
    const hash = hashFile(file);
    if (hash) manifest[file] = hash;
  }
  return manifest;
}

export function saveManifest(projectRoot, manifest) {
  const manifestPath = join(projectRoot, '.reversa', '_config', 'files-manifest.json');
  mkdirSync(dirname(manifestPath), { recursive: true });
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
}

export function loadManifest(projectRoot) {
  const manifestPath = join(projectRoot, '.reversa', '_config', 'files-manifest.json');
  if (!existsSync(manifestPath)) return {};
  try {
    return JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch {
    return {};
  }
}

export function hasFileBeenModified(filePath, originalHash) {
  const current = hashFile(filePath);
  if (!current) return false;
  return current !== originalHash;
}
