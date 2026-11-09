// Sobe o CRM de exemplo de cada backend num banco temporário e roda a suíte de conformidade contra ele, duas vezes
// no mesmo banco (a suíte precisa ser repetível). Backends: o c3-engine em Rust (crates/c3-example) e o
// @c3theme/engine-node (apps/c3-example-node). Uso: pnpm conformance [rust|node]   (sem nome: os dois)
//
// Para testar outro backend já rodando: node packages/conformance/src/cli.mjs <url-da-api>

import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BACKENDS = {
  rust: {
    build: [['cargo', ['build', '-q', '-p', 'c3-example']]],
    start: ['target/debug/c3-example', []],
    database: (file) => `sqlite://${file}`
  },
  node: {
    build: [
      ['pnpm', ['--filter', '@c3theme/engine-node', 'build']],
      ['pnpm', ['--filter', '@c3theme/c3-example-node', 'build']]
    ],
    start: ['node', ['apps/c3-example-node/dist/main.js']],
    database: (file) => file
  }
};

const freePort = () =>
  new Promise((resolve) => {
    const s = createServer().listen(0, '127.0.0.1', () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });

async function waitUp(api) {
  for (let i = 0; i < 100; i++) {
    const up = await fetch(`${api}/_meta/app`).then(
      (r) => r.ok,
      () => false
    );
    if (up) return true;
    await new Promise((r) => setTimeout(r, 100));
  }
  return false;
}

async function run(name) {
  const backend = BACKENDS[name];
  for (const [cmd, args] of backend.build) {
    const build = spawnSync(cmd, args, { stdio: 'inherit' });
    if (build.status !== 0) return build.status ?? 1;
  }
  const port = await freePort();
  const dir = mkdtempSync(join(tmpdir(), 'c3-conformance-'));
  const [cmd, args] = backend.start;
  const server = spawn(cmd, args, {
    env: { ...process.env, PORT: String(port), DATABASE_URL: backend.database(join(dir, 'c3.db')) },
    stdio: ['ignore', 'inherit', 'inherit']
  });
  // espera o processo sair (SIGTERM): a medição de cobertura do Rust grava o perfil na saída
  const exited = new Promise((resolve) => server.once('exit', resolve));
  const stop = async () => {
    server.kill();
    await exited;
    rmSync(dir, { recursive: true, force: true });
  };
  const api = `http://127.0.0.1:${port}/api`;
  if (!(await waitUp(api))) {
    await stop();
    console.error(`o exemplo ${name} não subiu`);
    return 1;
  }
  console.log(`\n== backend ${name} ==`);
  const first = spawnSync('node', ['packages/conformance/src/cli.mjs', api], { stdio: 'inherit' });
  const again =
    first.status === 0 ? spawnSync('node', ['packages/conformance/src/cli.mjs', api], { stdio: ['ignore', 'ignore', 'inherit'] }) : first;
  if (first.status === 0 && again.status !== 0) console.error(`${name}: a segunda rodada no mesmo banco falhou`);
  await stop();
  return first.status || again.status || 0;
}

const only = process.argv[2];
if (only && !BACKENDS[only]) {
  console.error(`backend desconhecido: ${only} (use ${Object.keys(BACKENDS).join(' ou ')})`);
  process.exit(2);
}
let status = 0;
for (const name of only ? [only] : Object.keys(BACKENDS)) status = (await run(name)) || status;
process.exit(status);
