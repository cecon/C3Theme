// Copia para o dist os `.mjs`/`.d.mts` escritos à mão em src/ (o tsc não emite: são JS que o validate-spec também
// importa). Todos, sem lista fixa: a lista esquecia o próximo e o pacote saía quebrado (#80, hrefSlots.mjs).
// Uso: node ../../scripts/copy-src-modules.mjs src dist   (a partir da pasta do pacote, depois do tsc)
import { copyFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

import { isHandwrittenModule } from './pack/imports.mjs';

const src = resolve(process.argv[2] ?? 'src');
const dist = resolve(process.argv[3] ?? 'dist');

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const files = walk(src).filter((full) => isHandwrittenModule(full));
for (const full of files) {
  const target = join(dist, relative(src, full));
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(full, target);
}
console.log(`copy-src-modules: ${files.length} arquivos de ${src} para ${dist}`);
