// Cobertura das linhas que o PR escreveu (meta 80%). Puro: recebe as linhas alteradas e o lcov.
import { isRustSource, isTsSource } from './scope.mjs';
import { toRanges } from './diff.mjs';

export const DIFF_COVERAGE_TARGET = 80;

/**
 * Só conta linha que o relatório instrumenta (comentário, tipo e chave solta não entram) em arquivo de produção.
 * Arquivo de produção fora do lcov não tem como saber quais linhas são código: vai para `missing`, só como aviso
 * (o vitest já põe no relatório todo fonte incluído, mesmo sem teste).
 * @param {Map<string, number[]>} changed
 * @param {Map<string, Map<number, number>>} lcov
 */
export function diffCoverage(changed, lcov) {
  let covered = 0;
  let total = 0;
  const uncovered = [];
  const missing = [];
  for (const [file, lines] of changed) {
    if (!isTsSource(file) && !isRustSource(file)) continue;
    const hits = lcov.get(file);
    if (!hits) {
      missing.push(file);
      continue;
    }
    const misses = [];
    for (const n of lines) {
      if (!hits.has(n)) continue;
      total++;
      if (hits.get(n) > 0) covered++;
      else misses.push(n);
    }
    if (misses.length) uncovered.push({ file, ranges: toRanges(misses) });
  }
  return { covered, total, percent: total === 0 ? null : (covered / total) * 100, uncovered, missing };
}

/** Texto do relatório para o log do CI. */
export function formatReport(result, target = DIFF_COVERAGE_TARGET) {
  const lines = [];
  if (result.percent === null) lines.push('cobertura do diff: nenhuma linha de código de produção alterada');
  else lines.push(`cobertura do diff: ${result.covered}/${result.total} linhas (${result.percent.toFixed(2)}%), mínimo ${target}%`);
  for (const { file, ranges } of result.uncovered) {
    const shown = ranges.map(([a, b]) => (a === b ? `${a}` : `${a}-${b}`)).join(', ');
    lines.push(`  sem teste: ${file}: ${shown}`);
  }
  for (const file of result.missing) lines.push(`  fora do relatório (nenhum teste carrega): ${file}`);
  return lines.join('\n');
}
