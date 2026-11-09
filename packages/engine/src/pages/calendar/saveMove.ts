// Gravar o evento arrastado ou esticado: PATCH com a versão lida (If-Match); recusado, o evento volta.

import type { C3Client } from '../../api';
import type { WireRecord } from '../../types';

export interface MoveResult {
  ok: boolean;
  message: string;
}

/** Grava `patch` no registro `id`; em erro (412 de versão velha, 422, rede) chama `revert` e devolve a mensagem. */
export async function saveMove(
  client: Pick<C3Client, 'update'>,
  entity: string,
  id: string,
  patch: WireRecord,
  version: string | undefined,
  revert: () => void
): Promise<MoveResult> {
  try {
    await client.update(entity, id, patch, { ifMatch: version });
    return { ok: true, message: 'Salvo.' };
  } catch (e) {
    revert();
    return { ok: false, message: e instanceof Error ? e.message : 'Não foi possível salvar.' };
  }
}
