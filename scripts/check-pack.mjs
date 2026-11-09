// Confere o que vai para o npm em cada pacote publicável, sem publicar nada.
// Uso: node scripts/check-pack.mjs [ui|chat|engine|flow|electron ...]   (padrão: todos; o `pnpm pack` roda o prepare, que refaz o build)
// Para cada pacote: `pnpm pack` (o mesmo manifesto que o `pnpm publish` gera), lista o tarball e reprova se:
// falta LICENSE/README/dist, vai teste, sobra `workspace:` ou a condição `c3theme-source`, ou um alvo de
// `exports`/`main`/`types` não existe no tarball. O src/ vai (sem teste) para quem instala por git e resolve
// pela condição `c3theme-source`; no npm o publishConfig.exports já tira a condição.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const PUBLISHABLE = ['ui', 'chat', 'engine', 'flow', 'electron'];
const wanted = process.argv.slice(2);
const names = wanted.length ? wanted : PUBLISHABLE;

const unknown = names.filter((n) => !PUBLISHABLE.includes(n));
if (unknown.length) {
  console.error(`pacote fora da lista publicável: ${unknown.join(', ')}`);
  process.exit(2);
}

/** Alvos de arquivo em `exports` (aninhado por condição), `main` e `types`. */
function targets(manifest) {
  const out = [];
  const walk = (v, key) => {
    if (typeof v === 'string') out.push({ key, file: v });
    else if (v && typeof v === 'object') for (const [k, sub] of Object.entries(v)) walk(sub, `${key}.${k}`);
  };
  walk(manifest.exports, 'exports');
  if (manifest.main) out.push({ key: 'main', file: manifest.main });
  if (manifest.types) out.push({ key: 'types', file: manifest.types });
  return out;
}

function hasWorkspaceRange(manifest) {
  const sections = ['dependencies', 'peerDependencies', 'optionalDependencies', 'devDependencies'];
  return sections.flatMap((s) =>
    Object.entries(manifest[s] ?? {})
      .filter(([, range]) => String(range).startsWith('workspace:'))
      .map(([dep]) => `${s}.${dep}`)
  );
}

function check(name) {
  const dir = join(ROOT, 'packages', name);
  const dest = mkdtempSync(join(tmpdir(), `c3-pack-${name}-`));
  const problems = [];
  try {
    execFileSync('pnpm', ['pack', '--pack-destination', dest], { cwd: dir, stdio: 'pipe' });
    const tgz = readdirSync(dest).find((f) => f.endsWith('.tgz'));
    if (!tgz) throw new Error('pnpm pack não gerou o .tgz');
    const tarball = join(dest, tgz);
    const files = execFileSync('tar', ['-tzf', tarball], { encoding: 'utf8' })
      .split('\n')
      .filter(Boolean)
      .map((f) => f.replace(/^package\//, ''));
    execFileSync('tar', ['-xzf', tarball, '-C', dest, 'package/package.json']);
    const manifest = JSON.parse(readFileSync(join(dest, 'package', 'package.json'), 'utf8'));
    const set = new Set(files);

    for (const must of ['package.json', 'LICENSE', 'README.md']) if (!set.has(must)) problems.push(`falta ${must}`);
    if (!files.some((f) => f.startsWith('dist/'))) problems.push('falta dist/ (o build falhou?)');
    for (const f of files.filter((f) => /\.(test|spec|stories)\.([cm]?[jt]sx?(\.map)?|d\.[cm]?ts)$/.test(f)))
      problems.push(`vai teste/história: ${f}`);
    for (const dep of hasWorkspaceRange(manifest)) problems.push(`versão workspace: em ${dep}`);
    if (JSON.stringify(manifest.exports ?? {}).includes('c3theme-source'))
      problems.push('exports do npm ainda tem a condição c3theme-source (falta o publishConfig.exports)');
    if (manifest.private) problems.push('manifesto marcado como private');
    if (manifest.license !== 'MIT') problems.push(`licença ${manifest.license}, esperado MIT`);
    if (manifest.publishConfig?.access !== 'public') problems.push('publishConfig.access não é public');
    if (!manifest.repository?.url?.includes('github.com/cecon/C3Theme')) problems.push('repository.url ausente (o --provenance exige)');
    for (const { key, file } of targets(manifest)) {
      const clean = file.replace(/^\.\//, '');
      if (!set.has(clean)) problems.push(`${key} aponta para ${file}, que não está no tarball`);
    }

    const kb = Math.round(statSync(tarball).size / 1024);
    if (problems.length) {
      console.error(`✗ @c3theme/${name}@${manifest.version} (${files.length} arquivos, ${kb} KB)`);
      for (const p of problems) console.error(`    ${p}`);
    } else {
      console.log(`✓ @c3theme/${name}@${manifest.version} (${files.length} arquivos, ${kb} KB)`);
    }
  } finally {
    rmSync(dest, { recursive: true, force: true });
  }
  return problems.length === 0;
}

const results = names.map(check);
process.exit(results.every(Boolean) ? 0 : 1);
