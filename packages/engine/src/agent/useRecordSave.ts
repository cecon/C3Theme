import { useState } from 'react';
import { useSWRConfig } from 'swr';

import { ApiError, isStale } from '../api';
import { useEngine } from '../context';
import type { FieldDef, FieldErrors, WireRecord } from '../types';
import { STALE_UNDO } from '../undo';
import { recordTitle } from '../views';

export interface Saved {
  id: string;
  title: string;
  /** Para desfazer: `null` apaga o novo; senão, o valor de antes de cada campo alterado. */
  restore: WireRecord | null;
  /** `_version` de depois da gravação: o Desfazer só vale se o registro ainda está nela. */
  version?: string;
}

/** Num 412 ao gravar a alteração: o registro mudou enquanto o usuário conferia o rascunho. */
const STALE_SAVE = 'O registro mudou enquanto você conferia. Os valores de antes foram atualizados: confira e grave de novo.';

/** Valor de antes no formato de gravação (reference vai como id). */
function wireValue(f: FieldDef, v: unknown) {
  return f.type === 'reference' && v && typeof v === 'object' ? (v as { id: string }).id : (v ?? null);
}

/**
 * Grava o rascunho do assistente pelo CRUD da entidade, com a permissão do usuário, e desfaz (apaga o novo ou volta
 * os campos alterados). A alteração vai com If-Match na versão que o usuário conferiu, e o Desfazer com a versão de
 * depois e `C3-Undo`: se alguém gravou no meio, o servidor responde 412 e nada é sobrescrito.
 * Atualiza o cache do registro e das listas, como o formulário do motor.
 */
export default function useRecordSave(entity: string, id: string | undefined, fields: FieldDef[], current?: WireRecord) {
  const { client, entities } = useEngine();
  const { mutate } = useSWRConfig();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const def = entities[entity].def;

  const refresh = (rid: string, data?: WireRecord) => {
    // sem dado novo, só relê: o card não volta ao esqueleto no meio
    if (data) mutate(['c3-record', entity, rid], data, { revalidate: false });
    else mutate(['c3-record', entity, rid]);
    mutate((key) => Array.isArray(key) && key[0] === 'c3-list');
  };

  async function run<T>(work: () => Promise<T>, stale: string, rid?: string): Promise<T | undefined> {
    setBusy(true);
    setError(undefined);
    setFieldErrors({});
    try {
      return await work();
    } catch (e) {
      if (isStale(e)) {
        if (rid) refresh(rid);
        setError(stale);
        return undefined;
      }
      const fe = e instanceof ApiError && e.fields ? e.fields : {};
      setFieldErrors(fe);
      const outside = Object.keys(fe).filter((k) => !fields.some((f) => f.name === k));
      // erro em campo que o card não mostra: o formulário completo resolve
      setError(
        outside.length
          ? `Faltam dados que este rascunho não traz (${outside.join(', ')}). Abra o formulário completo.`
          : e instanceof Error
            ? e.message
            : 'Erro ao gravar.'
      );
      return undefined;
    } finally {
      setBusy(false);
    }
  }

  const save = (body: WireRecord) =>
    run(
      async (): Promise<Saved> => {
        const saved = id ? await client.update(entity, id, body, { ifMatch: current?._version }) : await client.create(entity, body);
        const rid = String(saved.id);
        refresh(rid, saved);
        const restore = id ? Object.fromEntries(fields.map((f) => [f.name, wireValue(f, current?.[f.name])])) : null;
        return { id: rid, title: recordTitle(def, saved) || `#${rid}`, restore, version: saved._version };
      },
      STALE_SAVE,
      id
    );

  /** `true` desfez; `undefined` não (o motivo fica em `error`). Sem versão não há como conferir, então não tenta. */
  const undo = (saved: Saved) =>
    run(
      async () => {
        if (!saved.version) throw new Error('Não dá para desfazer: o servidor não mandou a versão do registro.');
        const opts = { ifMatch: saved.version, undo: true };
        if (saved.restore) refresh(saved.id, await client.update(entity, saved.id, saved.restore, opts));
        else {
          await client.remove(entity, saved.id, opts);
          refresh(saved.id);
        }
        return true;
      },
      STALE_UNDO,
      saved.id
    );

  return { busy, error, fieldErrors, save, undo };
}
