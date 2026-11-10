// Indicações em lote (`customer.referrals`): ação da lista com um `reference` filtrado no input e uma grade em que o
// cliente de cada linha só pode ser da empresa escolhida na mesma linha (`$field` na coluna). O motor já conferiu os
// dois filtros; aqui só a gravação.

import { type ActionOutcome, ApiError, type ListActionCall, type Rec } from '@c3theme/engine-node';

import { type Db, tx } from './db';

export function applyReferrals(db: Db, call: ListActionCall): Promise<ActionOutcome> {
  const referrer = Number(call.input.referrer);
  const links = Array.isArray(call.input.links) ? (call.input.links as Rec[]) : [];
  if (!Number.isInteger(referrer)) throw ApiError.internal();
  return tx(db, async (t) => {
    for (const link of links)
      await t.execute('UPDATE customer SET referred_by = ? WHERE id = ? AND id <> ?', [referrer, Number(link.customer), referrer]);
    return { message: `${links.length} indicação(ões) registrada(s).` };
  });
}
