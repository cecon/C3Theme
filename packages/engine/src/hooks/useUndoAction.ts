import { useCallback } from 'react';
import { useSWRConfig } from 'swr';

import { isStale } from '../api';
import { useEngine } from '../context';
import type { ActionDef } from '../types';
import { inverseOf, STALE_UNDO } from '../undo';

export interface UndoOutcome {
  ok: boolean;
  /** Para o usuário: "Desfeito." ou por que não deu. */
  message: string;
}

/**
 * Desfazer de ação: roda a `inverse` com If-Match na versão de depois da ação e `C3-Undo`. Se alguém mexeu no
 * registro no meio, o servidor responde 412 e nada muda; a tela relê o registro.
 */
export default function useUndoAction(entity: string) {
  const { client, entities } = useEngine();
  const { mutate } = useSWRConfig();
  const { def, capabilities } = entities[entity];

  const inverse = useCallback((action: ActionDef) => inverseOf(def, capabilities, action), [def, capabilities]);

  const undo = useCallback(
    async (id: string, action: ActionDef, version: string): Promise<UndoOutcome> => {
      const inv = inverseOf(def, capabilities, action);
      if (!inv) return { ok: false, message: 'Esta ação não tem Desfazer.' };
      try {
        const result = await client.action(entity, id, inv.name, {}, { ifMatch: version, undo: true });
        mutate(['c3-record', entity, id], result.data ?? undefined, { revalidate: result.data === null });
        mutate((key) => Array.isArray(key) && key[0] === 'c3-list');
        return { ok: true, message: 'Desfeito.' };
      } catch (e) {
        if (isStale(e)) mutate(['c3-record', entity, id]);
        return { ok: false, message: isStale(e) ? STALE_UNDO : e instanceof Error ? e.message : 'Não deu para desfazer.' };
      }
    },
    [client, entity, def, capabilities, mutate]
  );

  return { inverse, undo };
}
