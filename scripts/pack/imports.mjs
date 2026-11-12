// Imports relativos do dist: acha cada um, põe a extensão que o Node ESM exige e diz quais apontam para arquivo
// que não existe. Funções puras (quem existe vem de `exists`), usadas no build (fix-dist-imports) e no pacote
// empacotado (check-pack). Sem isto, um `.mjs` de src/ que o build não copia passava calado e quebrava o app (#80).
import { posix } from 'node:path';

// `from './x'`, `import './x'`, `import('./x')`, também nos .d.ts (`import("./x").Tipo`)
export const SPEC = /(\bfrom\s*|\bimport\s*\(?\s*)(['"])(\.{1,2}\/[^'"]*)\2/g;

/** Arquivos do dist que podem ter import relativo. */
export const isModuleFile = (file) => /\.(js|mjs|d\.ts|d\.mts)$/.test(file);

/** Os imports relativos de um arquivo, na ordem em que aparecem. */
export function relativeSpecs(src) {
  return [...src.matchAll(SPEC)].map((m) => m[3]);
}

/**
 * O caminho com a extensão que o arquivo emitido tem (`./x` → `./x.js`, `./i18n` → `./i18n/index.js`),
 * ou null quando nada no dist responde. Com extensão explícita (`./x.mjs`), confere que o arquivo existe.
 * `fromFile` e o retorno de `exists` usam `/` (posix).
 */
export function resolveSpec(fromFile, spec, exists) {
  const base = posix.join(posix.dirname(fromFile), spec);
  if (/\.(css|json)$/.test(spec)) return spec;
  if (/\.m?js$/.test(spec)) return exists(base) ? spec : null;
  for (const ext of ['.js', '.mjs']) if (exists(base + ext)) return spec + ext;
  for (const ext of ['.js', '.mjs']) if (exists(posix.join(base, 'index' + ext))) return `${spec}/index${ext}`;
  return null;
}

/** Reescreve os imports de `src` com a extensão certa e junta os que não resolvem. */
export function fixImports(fromFile, src, exists) {
  const missing = [];
  const out = src.replace(SPEC, (all, head, quote, spec) => {
    const fixed = resolveSpec(fromFile, spec, exists);
    if (fixed === null) {
      missing.push(spec);
      return all;
    }
    return `${head}${quote}${fixed}${quote}`;
  });
  return { out, missing };
}

/**
 * Imports relativos que não acham arquivo dentro de um conjunto de arquivos (o tarball do pacote).
 * `files` mapeia caminho (posix, relativo à raiz do pacote) → conteúdo; só olha os módulos de `dist/`.
 */
export function missingInPackage(files) {
  const exists = (path) => files.has(path);
  const problems = [];
  for (const [file, src] of files) {
    if (!file.startsWith('dist/') || !isModuleFile(file)) continue;
    for (const spec of fixImports(file, src, exists).missing) problems.push(`${file} importa ${spec}, que não está no pacote`);
  }
  return problems;
}

/** Arquivos `.mjs`/`.d.mts` escritos à mão em src/ (o tsc não emite): o build copia todos para o dist. */
export const isHandwrittenModule = (name) => (name.endsWith('.mjs') || name.endsWith('.d.mts')) && !name.endsWith('.test.mjs');
