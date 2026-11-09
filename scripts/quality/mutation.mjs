// Régua de mutação (meta 90%): o que mutar num PR e como medir o placar. Puro; quem roda o Stryker e o
// cargo-mutants são os scripts mutation-ts.mjs e mutation-rust.mjs.
import { toRanges } from './diff.mjs';
import { isTsSource } from './scope.mjs';

/** Meta do projeto: placar de mutação mínimo (mutantes mortos ÷ mutantes válidos). */
export const MUTATION_TARGET = 90;

/**
 * Linhas do PR no formato do `mutate` do Stryker ("arquivo:início-fim"): só o que o PR escreveu é mutado, então
 * o placar mede o código novo, não a dívida antiga do arquivo.
 * @param {Map<string, number[]>} changed saída do parseChangedLines
 * @returns {string[]}
 */
export function strykerTargets(changed) {
  const targets = [];
  for (const [file, lines] of changed) {
    if (!isTsSource(file)) continue;
    for (const [start, end] of toRanges(lines)) targets.push(`${file}:${start}-${end}`);
  }
  return targets;
}

/**
 * Placar do cargo-mutants (mutants.out/outcomes.json) no mesmo critério do Stryker: tempo esgotado conta como
 * morto; mutante que nem compila (unviable) não conta.
 * @param {{ caught: number, missed: number, timeout: number }} outcomes
 * @returns {number | null} placar em %, ou null sem mutante válido
 */
export function cargoMutantsScore({ caught, missed, timeout }) {
  const valid = caught + missed + timeout;
  return valid === 0 ? null : ((caught + timeout) / valid) * 100;
}

/**
 * Veredito de um placar contra o piso. Sem mutante válido não há o que reprovar.
 * @param {number | null} score
 * @param {number} floor
 */
export function verdict(score, floor) {
  if (score === null) return { ok: true, message: 'nenhum mutante válido nas linhas alteradas' };
  const shown = score.toFixed(2);
  return score >= floor
    ? { ok: true, message: `placar de mutação ${shown}% (piso ${floor}%)` }
    : { ok: false, message: `placar de mutação ${shown}% abaixo do piso de ${floor}%` };
}
