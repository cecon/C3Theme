// Cobertura de linhas dos crates Rust, com a mesma meta dos pacotes TS (scripts/coverage-floors.ts): 80%.
// Roda os testes (substitui cargo test no CI) e, no workspace principal, também a suíte de conformidade contra o
// c3-example compilado com a medição ligada: o que o contrato exercita no c3-engine conta, como no engine-node.
// O c3-example em si fica fora da conta (é o CRM de exemplo). Branches no Rust exigem nightly: aqui só linhas.
//
// Uso: node scripts/coverage-rust.mjs   (precisa de cargo-llvm-cov e do componente llvm-tools-preview)

import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const TARGET = 80;

function run(cmd, args, env = process.env) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', env });
  if (r.status !== 0) {
    console.error(`coverage-rust: falhou: ${cmd} ${args.join(' ')}`);
    process.exit(r.status ?? 1);
  }
}

/** As variáveis do `cargo llvm-cov show-env`: cargo e o binário do exemplo compilados com a medição. */
function coverageEnv() {
  const out = execFileSync('cargo', ['llvm-cov', 'show-env', '--sh'], { encoding: 'utf8' });
  const env = { ...process.env };
  // valor com espaço ou símbolo vem entre aspas simples; o resto, sem
  for (const m of out.matchAll(/^export (\w+)=(?:'(.*)'|(.*))$/gm)) env[m[1]] = m[2] ?? m[3];
  return env;
}

// os perfis da rodada anterior (LLVM_PROFILE_FILE grava na raiz do target) somariam na conta
const removeProfiles = (dir) => {
  if (!existsSync(dir)) return;
  for (const f of readdirSync(dir)) if (f.endsWith('.profraw')) rmSync(join(dir, f));
};

// workspace principal: c3-engine (testes + conformidade)
console.log(`\n== c3-engine: mínimo de ${TARGET}% de linhas (testes + conformidade)`);
const env = coverageEnv();
removeProfiles(env.CARGO_LLVM_COV_TARGET_DIR);
run('cargo', ['test', '--workspace'], env);
run('node', ['scripts/conformance.mjs', 'rust'], env);
run(
  'cargo',
  ['llvm-cov', 'report', '--summary-only', '--ignore-filename-regex', 'crates/c3-example/', '--fail-under-lines', String(TARGET)],
  env
);

// adaptador rusqlite: workspace próprio (outro libsqlite3-sys)
console.log(`\n== c3-engine-rusqlite: mínimo de ${TARGET}% de linhas`);
run('cargo', [
  'llvm-cov',
  '--manifest-path',
  'crates/c3-engine-rusqlite/Cargo.toml',
  '--summary-only',
  '--fail-under-lines',
  String(TARGET)
]);
