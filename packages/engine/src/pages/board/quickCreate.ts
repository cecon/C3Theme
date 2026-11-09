// "Adicionar cartão": cria o registro só com o título e a coluna. Se o sistema pede mais, o formulário abre com o
// que já foi digitado.

import { ApiError, type C3Client } from '../../api';
import type { WireRecord } from '../../types';

export type QuickResult = { kind: 'created' } | { kind: 'form'; initial: WireRecord } | { kind: 'error'; message: string };

export async function quickCreate(client: Pick<C3Client, 'create'>, entity: string, initial: WireRecord): Promise<QuickResult> {
  try {
    await client.create(entity, initial);
    return { kind: 'created' };
  } catch (e) {
    // erro por campo (obrigatório, validação): quem resolve é o formulário
    if (e instanceof ApiError && e.fields) return { kind: 'form', initial };
    return { kind: 'error', message: e instanceof Error ? e.message : 'Não foi possível criar.' };
  }
}
