// Testes de mutação dos pacotes TS (Stryker). Meta 90% (scripts/quality/mutation.mjs).
//   node scripts/mutation-ts.mjs --diff        só as linhas que o PR escreveu, piso de 90% (CI do PR)
//   node scripts/mutation-ts.mjs <pacote>      o pacote inteiro, piso medido em mutation-floors.mjs (semanal)
import { spawnSync } from 'node:child_process';

import { parseChangedLines } from './quality/diff.mjs';
import { prDiff } from './quality/git.mjs';
import { MUTATION_FLOORS } from './quality/mutation-floors.mjs';
import { MUTATION_TARGET, strykerTargets } from './quality/mutation.mjs';

function stryker(env) {
  const r = spawnSync('pnpm', ['exec', 'stryker', 'run', 'stryker.config.mjs'], {
    stdio: 'inherit',
    env: { ...process.env, ...env }
  });
  return r.status ?? 1;
}

const arg = process.argv[2];
if (arg === '--diff') {
  const targets = strykerTargets(parseChangedLines(prDiff()));
  if (targets.length === 0) {
    console.log('mutação: o PR não muda fonte de pacote TS; nada a mutar');
    process.exit(0);
  }
  console.log(`mutação: ${targets.length} trecho(s) alterado(s), piso ${MUTATION_TARGET}%`);
  process.exit(stryker({ C3_MUTATE: JSON.stringify(targets), C3_BREAK: String(MUTATION_TARGET) }));
}

if (!(arg in MUTATION_FLOORS.ts)) {
  console.error(`uso: node scripts/mutation-ts.mjs --diff | <${Object.keys(MUTATION_FLOORS.ts).join('|')}>`);
  process.exit(2);
}
const floor = MUTATION_FLOORS.ts[arg];
if (floor === null) {
  console.log(`mutação: pacote ${arg} ainda sem piso; mede sem reprovar (meta ${MUTATION_TARGET}%)`);
  process.exit(stryker({ C3_PACKAGE: arg }));
}
console.log(`mutação: pacote ${arg}, piso ${floor}% (meta ${MUTATION_TARGET}%)`);
process.exit(stryker({ C3_PACKAGE: arg, C3_BREAK: String(floor) }));
