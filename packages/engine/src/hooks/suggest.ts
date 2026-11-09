import type { WireRecord } from '../types';

/**
 * Sugestões da prévia que podem entrar no input: só em campo conhecido que está vazio ou ainda tem a sugestão
 * anterior (`last`). O que o usuário digitou fica.
 */
export function suggestions(input: WireRecord, values: Record<string, unknown>, known: string[], last: Record<string, unknown>) {
  const free = (k: string) => input[k] === undefined || input[k] === null || input[k] === '' || input[k] === last[k];
  return Object.fromEntries(Object.entries(values).filter(([k]) => known.includes(k) && free(k)));
}
