// `seller.review` (ação da lista em etapas): cinco lotes, dois por chamada, com o cursor na posição do próximo.
// Não grava nada: serve para a suíte conferir o protocolo de `steps` (cursor de volta, progress na resposta).

import type { ActionOutcome, ListActionCall } from '@c3theme/engine-node';

const TOTAL = 5;
const STEP = 2;

export function review(call: ListActionCall): ActionOutcome {
  const from = Math.min(typeof call.cursor === 'number' ? call.cursor : 0, TOTAL);
  const done = Math.min(from + STEP, TOTAL);
  if (done === TOTAL) return { message: `Revisados ${TOTAL} lotes.`, progress: { total: TOTAL, done } };
  return { message: `Revisados ${done} de ${TOTAL} lotes.`, progress: { total: TOTAL, done, cursor: done } };
}
