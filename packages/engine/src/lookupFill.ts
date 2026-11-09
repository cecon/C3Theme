// Regras do "consultar e preencher" sem React: o que a resposta preenche e o que o Desfazer volta.

import type { WireRecord } from './types';

const empty = (v: unknown) => v === null || v === undefined || v === '';
export const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Resultado de uma consulta aplicada: o patch a gravar e o que cada campo tinha antes (para o Desfazer). */
export interface Fill {
  patch: WireRecord;
  before: WireRecord;
}

/**
 * Só preenche campo de `fills` vazio ou que ainda tem o valor que a consulta anterior pôs (`filled`):
 * o que o usuário digitou fica. Na ordem de `fills`.
 */
export function planFill(fills: string[], data: WireRecord, current: WireRecord, filled: WireRecord): Fill {
  const patch: WireRecord = {};
  const before: WireRecord = {};
  for (const k of fills) {
    if (!(k in data)) continue;
    const cur = current[k];
    if (!(empty(cur) || same(cur, filled[k]))) continue;
    patch[k] = data[k];
    before[k] = cur;
  }
  return { patch, before };
}

/** Desfazer: volta só os campos que ainda têm o valor preenchido; o que foi editado depois fica. */
export function planUndo(fill: Fill, current: WireRecord): WireRecord {
  return Object.fromEntries(
    Object.keys(fill.patch)
      .filter((k) => same(current[k], fill.patch[k]))
      .map((k) => [k, fill.before[k]])
  );
}
