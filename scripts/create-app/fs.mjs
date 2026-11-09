// Adaptador de disco do create-app: lê o template, escreve o plano e copia o seed.

import fs from 'node:fs';
import path from 'node:path';

/** Porta `templates` do plano sobre uma pasta (templates/create-app). */
export function templateDir(dir) {
  return {
    files(group) {
      const base = path.join(dir, group);
      return fs
        .readdirSync(base, { recursive: true, withFileTypes: true })
        .filter((d) => d.isFile())
        .map((d) => {
          const full = path.join(d.parentPath, d.name);
          return [path.relative(base, full).split(path.sep).join('/'), fs.readFileSync(full, 'utf8')];
        })
        .sort(([a], [b]) => a.localeCompare(b));
    }
  };
}

/** A primeira pasta do plano que já existe, se houver. */
export const existing = (root, dirs) => dirs.find((d) => fs.existsSync(path.join(root, d)));

export function writeFiles(root, files) {
  for (const f of files) {
    const p = path.join(root, f.path);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, f.content);
  }
}

const SKIP = new Set(['node_modules', 'dist', '.env']);

export function copySeed(root, plan) {
  const to = path.join(root, plan.to);
  const from = path.join(root, plan.from);
  fs.cpSync(from, to, { recursive: true, filter: (src) => !SKIP.has(path.basename(src)) });
  fs.copyFileSync(path.join(from, '.env.example'), path.join(to, '.env'));
  for (const [file, edit] of plan.edits) {
    const p = path.join(to, file);
    fs.writeFileSync(p, edit(fs.readFileSync(p, 'utf8')));
  }
}
