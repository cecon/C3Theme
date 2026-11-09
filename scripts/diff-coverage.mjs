// Cobertura das linhas que o PR escreveu: mínimo de 80% (scripts/quality/diffCoverage.mjs). Lê os lcov que o
// pnpm test:coverage (coverage/lcov.info) e o pnpm coverage:rust (coverage/rust-*.lcov) deixam; rode depois deles.
// Uso: node scripts/diff-coverage.mjs   (base do PR em C3_BASE; padrão origin/main)
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { parseChangedLines } from './quality/diff.mjs';
import { DIFF_COVERAGE_TARGET, diffCoverage, formatReport } from './quality/diffCoverage.mjs';
import { prDiff } from './quality/git.mjs';
import { mergeLcov, parseLcov } from './quality/lcov.mjs';

const root = resolve(import.meta.dirname, '..');
const dir = join(root, 'coverage');
const reports = existsSync(dir) ? readdirSync(dir).filter((f) => f === 'lcov.info' || /^rust-.+\.lcov$/.test(f)) : [];
if (reports.length === 0) {
  console.error('diff-coverage: nenhum lcov em coverage/; rode pnpm test:coverage e pnpm coverage:rust antes');
  process.exit(2);
}

const lcov = mergeLcov(...reports.map((f) => parseLcov(readFileSync(join(dir, f), 'utf8'), root)));
const result = diffCoverage(parseChangedLines(prDiff()), lcov);
console.log(`relatórios: ${reports.join(', ')}`);
console.log(formatReport(result));
process.exit(result.percent === null || result.percent >= DIFF_COVERAGE_TARGET ? 0 : 1);
