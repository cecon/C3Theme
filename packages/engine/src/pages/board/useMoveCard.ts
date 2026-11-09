import { useState } from 'react';
import { useSWRConfig } from 'swr';

import { notify } from '@c3theme/ui';
import { useEngine } from '../../context';
import type { EnumValue, WireRecord } from '../../types';

export interface PendingMove {
  row: WireRecord;
  from: string;
  to: string;
}

/**
 * Arrastar um cartão grava `groupBy` com PATCH. Enquanto grava, o cartão já aparece na coluna nova;
 * se o backend recusar (regra de negócio, permissão), volta e o motivo aparece num aviso.
 */
export function useMoveCard(entity: string, groupBy: string) {
  const { client } = useEngine();
  const { mutate } = useSWRConfig();
  const [pending, setPending] = useState<PendingMove[]>([]);

  const move = async (row: WireRecord, from: string, to: EnumValue) => {
    const id = row.id!;
    const moved = { ...row, [groupBy]: to };
    setPending((p) => [...p.filter((m) => m.row.id !== id), { row: moved, from, to: String(to) }]);
    try {
      await client.update(entity, id, { [groupBy]: to });
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Não foi possível mover o cartão.', 'error');
    }
    // relê as colunas (e a lista, os contadores do menu) antes de soltar o estado provisório
    await mutate((key) => Array.isArray(key) && key[0] === 'c3-list' && key[1] === entity);
    await mutate(['c3-record', entity, id]);
    setPending((p) => p.filter((m) => m.row.id !== id));
  };

  return { pending, move };
}
