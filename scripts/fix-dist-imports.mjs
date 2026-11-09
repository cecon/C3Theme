// Depois do `tsc`: põe a extensão nos imports relativos do dist (`./Panel` → `./Panel.js`, `./i18n` → `./i18n/index.js`).
// O código usa moduleResolution Bundler (import sem extensão), que Vite/webpack resolvem, mas o Node ESM não:
// sem isto, SSR, vitest com dependência externa e qualquer `node` que importe o pacote quebram ao instalar do npm.
// Uso: node ../../scripts/fix-dist-imports.mjs dist   (a partir da pasta do pacote)
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const root = resolve(process.argv[2] ?? 'dist');
if (!existsSync(root)) {
  console.error(`fix-dist-imports: ${root} não existe (rode o tsc antes)`);
  process.exit(1);
}

// `from './x'`, `import './x'`, `import('./x')`, também nos .d.ts (`import("./x").Tipo`)
const SPEC = /(\bfrom\s*|\bimport\s*\(?\s*)(['"])(\.{1,2}\/[^'"]*)\2/g;

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

/** Extensão que o arquivo emitido tem: .js para .js, .d.ts (o par é o .js) e .mjs/.d.mts para .mjs. */
function resolveSpec(fromFile, spec) {
  if (/\.(m?js|json|css)$/.test(spec)) return spec;
  const base = resolve(dirname(fromFile), spec);
  for (const ext of ['.js', '.mjs']) if (existsSync(base + ext)) return spec + ext;
  for (const ext of ['.js', '.mjs']) if (existsSync(join(base, 'index' + ext))) return `${spec}/index${ext}`;
  return null;
}

let changed = 0;
const missing = [];
for (const file of walk(root).filter((f) => /\.(js|mjs|d\.ts|d\.mts)$/.test(f))) {
  const src = readFileSync(file, 'utf8');
  const out = src.replace(SPEC, (all, head, quote, spec) => {
    const fixed = resolveSpec(file, spec);
    if (!fixed) {
      missing.push(`${file}: ${spec}`);
      return all;
    }
    return `${head}${quote}${fixed}${quote}`;
  });
  if (out !== src) {
    writeFileSync(file, out);
    changed += 1;
  }
}

if (missing.length) {
  console.error(`fix-dist-imports: import relativo sem arquivo no dist:\n  ${missing.join('\n  ')}`);
  process.exit(1);
}
console.log(`fix-dist-imports: ${changed} arquivos ajustados em ${root}`);
