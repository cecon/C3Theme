// Prova que o app gerado pelo create-app compila e sobe: gera um app por backend dentro do repositório, instala,
// roda o typecheck, compila os backends, sobe o Node e o Rust e grava um contato pela API. No fim, apaga o que gerou
// e devolve os lockfiles como estavam. Uso: node scripts/create-app-smoke.mjs   (CI: depois da conformidade)

import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const APPS = [
  { name: 'smoke-motor-node', backend: 'node', port: 3091, start: ['node', ['apps/smoke-motor-node-api/dist/main.js']] },
  { name: 'smoke-motor-rust', backend: 'rust', port: 3092, start: ['target/debug/smoke-motor-rust-api', []] }
];
const LOCKS = ['pnpm-lock.yaml', 'Cargo.lock'];
const generated = (a) => [`apps/${a.name}`, a.backend === 'node' ? `apps/${a.name}-api` : `crates/${a.name}-api`];

function sh(cmd, args) {
  console.log(`$ ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, { cwd: root, stdio: 'inherit' });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(' ')} saiu com ${r.status}`);
}

async function api(port, path, init) {
  const res = await fetch(`http://127.0.0.1:${port}/api${path}`, init);
  const body = await res.json();
  if (!res.ok) throw new Error(`${path}: ${res.status} ${JSON.stringify(body)}`);
  return body;
}

async function boot(app, db) {
  const [cmd, args] = app.start;
  const child = spawn(cmd, args, {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, PORT: String(app.port), DATABASE_URL: `sqlite://${db}` }
  });
  for (let i = 0; i < 100; i++) {
    try {
      await api(app.port, '/_meta/app');
      return child;
    } catch {
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  child.kill();
  throw new Error(`${app.name}: a API não subiu`);
}

async function exercise(app, dir) {
  const child = await boot(app, join(dir, `${app.name}.db`));
  try {
    const meta = await api(app.port, '/_meta/app');
    if (!meta.data.entities.includes('contact')) throw new Error(`${app.name}: /_meta/app sem contact`);
    const saved = await api(app.port, '/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Ana', phone: '11981234567' })
    });
    const list = await api(app.port, '/contact');
    if (saved.data.status !== 'active' || list.meta.total !== 1) throw new Error(`${app.name}: gravação ou lista inesperada`);
    console.log(`✔ ${app.name}: API no ar, contato gravado e listado`);
  } finally {
    child.kill();
  }
}

const locks = new Map(LOCKS.map((f) => [f, readFileSync(join(root, f), 'utf8')]));
const dir = mkdtempSync(join(tmpdir(), 'create-app-smoke-'));
let code = 0;
try {
  for (const a of APPS) sh('node', ['scripts/create-app.mjs', a.name, '--backend', a.backend]);
  sh('pnpm', ['install', '--no-frozen-lockfile', '--prefer-offline']);
  for (const a of APPS) sh('pnpm', ['--filter', `@c3theme/${a.name}`, 'typecheck']);
  sh('pnpm', ['exec', 'eslint', ...APPS.map((a) => `apps/${a.name}`), 'apps/smoke-motor-node-api']);
  sh('pnpm', ['--filter', '@c3theme/engine-node', 'build']);
  sh('pnpm', ['--filter', '@c3theme/smoke-motor-node-api', 'build']);
  sh('cargo', ['clippy', '-q', '-p', 'smoke-motor-rust-api', '--', '-D', 'warnings']);
  sh('cargo', ['build', '-q', '-p', 'smoke-motor-rust-api']);
  for (const a of APPS) await exercise(a, dir);
} catch (e) {
  console.error(`✘ ${e.message}`);
  code = 1;
} finally {
  for (const a of APPS) for (const d of generated(a)) rmSync(join(root, d), { recursive: true, force: true });
  for (const [f, text] of locks) writeFileSync(join(root, f), text);
  rmSync(dir, { recursive: true, force: true });
  spawnSync('pnpm', ['install', '--frozen-lockfile', '--prefer-offline'], { cwd: root, stdio: 'ignore' });
}
process.exit(code);
