import { notify } from '@c3theme/ui';

import type { ActionDef } from '../actionTypes';
import type { C3Client } from '../api';
import type { WireRecord } from '../types';

/**
 * Valores iniciais do input antes de abrir o diálogo (`prefill: true`); ação sem prefill abre com os defaults.
 * Falhou (sem permissão, fora do ar): avisa e devolve `null`, e o diálogo não abre com a grade vazia.
 */
export async function loadPrefill(client: C3Client, entity: string, action: ActionDef, id?: string): Promise<WireRecord | null> {
  // em lote não há um registro para o sistema calcular: abre com os defaults
  if (!action.prefill || (action.target !== 'list' && !id)) return {};
  try {
    return await client.prefill(entity, action.name, id);
  } catch (e) {
    notify(e instanceof Error ? e.message : 'Não deu para carregar os valores iniciais.', 'error');
    return null;
  }
}
