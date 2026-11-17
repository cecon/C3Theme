// Ordem das abas (#134): funções puras, para o arrastar e o menu ("mover para a esquerda/direita") darem o mesmo
// resultado.

/** Move `id` `delta` posições, sem passar das pontas nem da primeira posição fixa (`locked`). */
export function moveBy(ids: readonly string[], id: string, delta: number, locked = 0): string[] {
  const from = ids.indexOf(id);
  if (from < locked) return [...ids];
  const to = Math.min(ids.length - 1, Math.max(locked, from + delta));
  return moveTo(ids, id, to);
}

/** Põe `id` na posição `to` (os outros deslizam). */
export function moveTo(ids: readonly string[], id: string, to: number): string[] {
  const rest = ids.filter((x) => x !== id);
  if (rest.length === ids.length) return [...ids];
  rest.splice(Math.min(Math.max(to, 0), rest.length), 0, id);
  return rest;
}

/** Quem fica ativa quando `id` fecha: a da esquerda; sem ela, a da direita. */
export function neighborOf(ids: readonly string[], id: string): string | undefined {
  const at = ids.indexOf(id);
  return at < 0 ? undefined : (ids[at - 1] ?? ids[at + 1]);
}
