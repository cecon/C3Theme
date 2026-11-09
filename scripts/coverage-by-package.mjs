// Cobertura por pacote, a partir de coverage/coverage-summary.json (pnpm test:coverage gera).
import { readFileSync } from 'node:fs';

const summary = JSON.parse(readFileSync('coverage/coverage-summary.json', 'utf8'));
const by = {};
for (const [file, v] of Object.entries(summary)) {
  const m = /packages\/([^/]+)\/src\//.exec(file);
  if (!m) continue;
  const p = (by[m[1]] ??= { l: 0, lt: 0, b: 0, bt: 0 });
  p.l += v.lines.covered;
  p.lt += v.lines.total;
  p.b += v.branches.covered;
  p.bt += v.branches.total;
}
const pct = (a, b) => (b ? ((100 * a) / b).toFixed(1) : '100.0');
for (const [name, p] of Object.entries(by).sort())
  console.log(`${name.padEnd(12)} linhas ${pct(p.l, p.lt).padStart(5)}%  branches ${pct(p.b, p.bt).padStart(5)}%`);
