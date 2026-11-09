// Testes de mutação do Rust (cargo-mutants), nos dois workspaces (raiz e o adaptador rusqlite). Meta 90%.
//   node scripts/mutation-rust.mjs --diff     só o que o PR mudou (--in-diff), piso de 90% (CI do PR)
//   node scripts/mutation-rust.mjs <k>/<n>    fatia k de n de tudo (--shard); grava em reports/mutation/rust (semanal)
//   node scripts/mutation-rust.mjs --sum <dir>  soma as fatias gravadas e compara com o piso medido (semanal)
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { parseChangedLines, scopeDiff } from './quality/diff.mjs';
import { prDiff } from './quality/git.mjs';
import { MUTATION_FLOORS } from './quality/mutation-floors.mjs';
import { cargoMutantsScore, MUTATION_TARGET, verdict } from './quality/mutation.mjs';
import { isRustSource } from './quality/scope.mjs';

// o adaptador rusqlite é outro workspace (outro libsqlite3-sys): roda à parte, com os caminhos relativos a ele
const WORKSPACES = [
  { dir: '.', prefix: '', skip: 'crates/c3-engine-rusqlite/' },
  { dir: 'crates/c3-engine-rusqlite', prefix: 'crates/c3-engine-rusqlite/' }
];
// cargo-mutants: 0 todos mortos, 2 algum sobreviveu, 3 algum estourou o tempo; o resto é falha de verdade
const MEASURED = new Set([0, 2, 3]);

function mutants(dir, args) {
  const out = mkdtempSync(join(tmpdir(), 'c3-mutants-'));
  const cmd = ['mutants', '--dir', dir, '--output', out, '--no-shuffle', '--colors', 'never', ...args];
  console.log(`$ cargo ${cmd.join(' ')}`);
  const r = spawnSync('cargo', cmd, { stdio: 'inherit' });
  if (!MEASURED.has(r.status)) throw new Error(`cargo-mutants saiu com ${r.status} em ${dir}`);
  return JSON.parse(readFileSync(join(out, 'mutants.out', 'outcomes.json'), 'utf8'));
}

function total(results) {
  return results.reduce((acc, o) => ({ caught: acc.caught + o.caught, missed: acc.missed + o.missed, timeout: acc.timeout + o.timeout }), {
    caught: 0,
    missed: 0,
    timeout: 0
  });
}

function diffRuns() {
  const diff = prDiff();
  const results = [];
  for (const ws of WORKSPACES) {
    const scoped = ws.prefix ? scopeDiff(diff, ws.prefix) : diff;
    const files = [...parseChangedLines(scoped).keys()].filter((f) => isRustSource(ws.prefix + f));
    if (files.length === 0 || (ws.skip && files.every((f) => f.startsWith(ws.skip)))) continue;
    const file = join(mkdtempSync(join(tmpdir(), 'c3-diff-')), 'pr.diff');
    writeFileSync(file, scoped);
    results.push(mutants(ws.dir, ['--in-diff', file]));
  }
  return { results, floor: MUTATION_TARGET };
}

function shardRuns(shard) {
  const dir = 'reports/mutation/rust';
  mkdirSync(dir, { recursive: true });
  const results = WORKSPACES.map((ws, i) => {
    const outcomes = mutants(ws.dir, ['--shard', shard]);
    writeFileSync(join(dir, `ws${i}-${shard.replace('/', 'of')}.json`), JSON.stringify(outcomes));
    return outcomes;
  });
  return { results, floor: null };
}

/** As fatias da rodada semanal, gravadas por shardRuns (em qualquer subpasta de dir). */
function summedRuns(dir) {
  const files = readdirSync(dir, { recursive: true }).filter((f) => String(f).endsWith('.json'));
  return { results: files.map((f) => JSON.parse(readFileSync(join(dir, String(f)), 'utf8'))), floor: MUTATION_FLOORS.rust };
}

function runs(args) {
  if (args[0] === '--diff') return diffRuns();
  if (args[0] === '--sum' && args[1]) return summedRuns(args[1]);
  if (/^\d+\/\d+$/.test(args[0] ?? '')) return shardRuns(args[0]);
  console.error('uso: node scripts/mutation-rust.mjs --diff | <k>/<n> | --sum <dir>');
  process.exit(2);
}

const { results, floor } = runs(process.argv.slice(2));
if (results.length === 0) {
  console.log('mutação: nada a mutar no Rust');
  process.exit(0);
}
const sum = total(results);
const score = cargoMutantsScore(sum);
const v = floor === null ? { ok: true, message: `placar ${score?.toFixed(2) ?? '-'}% (sem piso)` } : verdict(score, floor);
console.log(`mutação Rust: ${sum.caught} mortos, ${sum.timeout} por tempo, ${sum.missed} sobreviveram; ${v.message}`);
process.exit(v.ok ? 0 : 1);
