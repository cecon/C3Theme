// Depois do `tsc`: põe a extensão nos imports relativos do dist (`./Panel` → `./Panel.js`, `./i18n` → `./i18n/index.js`).
// O código usa moduleResolution Bundler (import sem extensão), que Vite/webpack resolvem, mas o Node ESM não:
// sem isto, SSR, vitest com dependência externa e qualquer `node` que importe o pacote quebram ao instalar do npm.
// Reprova o build quando um import relativo não acha arquivo no dist, com ou sem extensão (#80: `../../hrefSlots.mjs`).
// Uso: node ../../scripts/fix-dist-imports.mjs dist   (a partir da pasta do pacote)
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

import { fixImports, isModuleFile } from './pack/imports.mjs';

const root = resolve(process.argv[2] ?? 'dist');
if (!existsSync(root)) {
  console.error(`fix-dist-imports: ${root} não existe (rode o tsc antes)`);
  process.exit(1);
}

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const toPosix = (path) => path.split(sep).join('/');
const exists = (path) => existsSync(join(root, path));

let changed = 0;
const missing = [];
for (const full of walk(root).filter(isModuleFile)) {
  const file = toPosix(relative(root, full));
  const src = readFileSync(full, 'utf8');
  const result = fixImports(file, src, exists);
  for (const spec of result.missing) missing.push(`${file}: ${spec}`);
  if (result.out !== src) {
    writeFileSync(full, result.out);
    changed += 1;
  }
}

if (missing.length) {
  console.error(`fix-dist-imports: import relativo sem arquivo no dist:\n  ${missing.join('\n  ')}`);
  process.exit(1);
}
console.log(`fix-dist-imports: ${changed} arquivos ajustados em ${root}`);
