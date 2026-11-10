import { useCallback } from 'react';
import { useSWRConfig } from 'swr';

import { notify, type NotifyAction } from '@c3theme/ui';
import { isStale } from '../api';
import { useEngine } from '../context';
import { toInput, withParent } from '../formValues';
import { fieldTypes, fieldVisible, sectionGates } from '../sectionVisibility';
import type { EntityDef, WireRecord } from '../types';
import { STALE_UNDO, undoable } from '../undo';

/**
 * Corpo que volta o registro ao de antes: os campos e as listas `with_parent` como estavam. Linha que a gravação
 * apagou volta sem id (é criada de novo); as que ficaram mantêm o id.
 */
export function restoreBody(def: EntityDef, before: WireRecord, saved: WireRecord, childDef: (e: string) => EntityDef | undefined) {
  const types = fieldTypes(def);
  const gates = sectionGates(def);
  const body = toInput(def, before, (f) => fieldVisible(f, before, types, gates), childDef);
  for (const rel of withParent(def)) {
    const rows = body[rel.entity] as WireRecord[] | undefined;
    if (!rows) continue;
    const kept = new Set(((saved[rel.entity] as WireRecord[] | undefined) ?? []).map((r) => String(r.id)));
    body[rel.entity] = rows.map(({ id, ...row }) => (id !== undefined && kept.has(String(id)) ? { id, ...row } : row));
  }
  return body;
}

/**
 * Desfazer do Salvar do formulário (#12): devolve a ação do aviso, ou nada se a entidade é `undoable: false` ou o
 * servidor não mandou a versão. O Desfazer manda o registro de antes com If-Match na versão de depois e `C3-Undo`;
 * se alguém gravou no meio, o servidor responde 412 e nada muda.
 */
export default function useSaveUndo(entity: string) {
  const { client, entities } = useEngine();
  const { mutate } = useSWRConfig();
  const def = entities[entity].def;

  return useCallback(
    (before: WireRecord | undefined, saved: WireRecord): NotifyAction | undefined => {
      const version = saved._version as string | undefined;
      if (!before || !version || !undoable(def)) return undefined;
      const id = String(saved.id);
      const body = restoreBody(def, before, saved, (e) => entities[e]?.def);
      const run = async () => {
        try {
          const back = await client.update(entity, id, body, { ifMatch: version, undo: true });
          mutate(['c3-record', entity, id], back, { revalidate: false });
          notify('Desfeito.');
        } catch (e) {
          if (isStale(e)) mutate(['c3-record', entity, id]);
          notify(isStale(e) ? STALE_UNDO : e instanceof Error ? e.message : 'Não deu para desfazer.', 'warning');
        }
        mutate((key) => Array.isArray(key) && key[0] === 'c3-list' && key[1] === entity);
      };
      return { label: 'Desfazer', onClick: () => void run() };
    },
    [client, def, entities, entity, mutate]
  );
}
