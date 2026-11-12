import { useCallback, useEffect, useRef, useState } from 'react';
import { useSWRConfig } from 'swr';

import { ApiError, isStale } from '../api';
import { useEngine } from '../context';
import type { FieldDef, WireRecord } from '../types';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

/** Grava na hora o que muda (switch, select, data, reference); texto e número só ao sair do campo. */
export const commitsOnChange = (f: FieldDef) =>
  ['boolean', 'flags', 'date', 'datetime', 'reference', 'file'].includes(f.type) ||
  Boolean(f.options?.length) ||
  f.component === 'shortcut';

const empty = (v: unknown) => v === null || v === undefined || v === '';

/** Valor como vai no PATCH: reference vai pelo id. */
const wireValue = (f: FieldDef, v: unknown) =>
  f.type === 'reference' && v && typeof v === 'object' ? (v as { id: string }).id : (v ?? null);

/**
 * Salvar na hora (`views.form.autosave`, #160): cada campo vai sozinho num PATCH com `_version`. Os pedidos saem
 * em fila, cada um com a versão que o anterior devolveu. Erro de validação fica no campo e o valor volta ao gravado;
 * 412 relê o registro.
 */
export default function useAutosave(entity: string, id: string, loaded: WireRecord | undefined) {
  const { client, entities } = useEngine();
  const { mutate } = useSWRConfig();
  const def = entities[entity].def;
  const [record, setRecord] = useState<WireRecord>(loaded ?? {});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<SaveState>('idle');
  const [formError, setFormError] = useState<string>();
  const [pending, setPending] = useState<{ field: FieldDef; value: unknown; required: boolean }>();
  const [restart, setRestart] = useState<FieldDef>();
  const saved = useRef<WireRecord>(loaded ?? {});
  const queue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    if (!loaded) return;
    saved.current = loaded;
    setRecord(loaded);
  }, [loaded]);

  const send = useCallback(
    async (f: FieldDef, value: unknown, required: boolean) => {
      const before = saved.current[f.name];
      if (JSON.stringify(wireValue(f, value)) === JSON.stringify(wireValue(f, before))) return;
      const revert = (message: string) => {
        setErrors((e) => ({ ...e, [f.name]: message }));
        setRecord((r) => ({ ...r, [f.name]: before }));
      };
      if (
        f.component === 'shortcut' &&
        value &&
        def.fields.some((other) => other.name !== f.name && other.component === 'shortcut' && saved.current[other.name] === value)
      )
        return revert('Este atalho já está em uso.');
      if (required && empty(value)) return revert('Campo obrigatório.');
      setState('saving');
      setFormError(undefined);
      try {
        const prev = saved.current;
        const version = prev._version as string | undefined;
        const next = await client.update(entity, id, { [f.name]: wireValue(f, value) }, version ? { ifMatch: version } : undefined);
        saved.current = next;
        // vale o registro gravado (o servidor pode ter calculado outros campos), menos o que o usuário ainda está digitando
        setRecord((r) => {
          const out = { ...next };
          for (const k of Object.keys(r)) if (k !== f.name && r[k] !== prev[k]) out[k] = r[k];
          return out;
        });
        mutate(['c3-record', entity, id], next, { revalidate: false });
        setState('saved');
        if (f.restartNotice) setRestart(f);
      } catch (e) {
        setState('error');
        if (isStale(e)) {
          setFormError('Esta configuração mudou em outro lugar. Os valores foram relidos.');
          const fresh = await client.get(entity, id).catch(() => undefined);
          if (fresh) {
            saved.current = fresh;
            setRecord(fresh);
          }
        } else if (e instanceof ApiError && e.fields?.[f.name]) {
          revert(e.fields[f.name][0].message);
        } else {
          setRecord((r) => ({ ...r, [f.name]: before }));
          setFormError(e instanceof Error ? e.message : 'Erro ao salvar.');
        }
      }
    },
    [client, entity, id, mutate, def.fields]
  );

  /** Grava o campo (em fila). Sem mudança em relação ao gravado, não faz nada. */
  const commit = useCallback(
    (f: FieldDef, value: unknown, required: boolean) => {
      if (f.confirmChange && JSON.stringify(value) !== JSON.stringify(saved.current[f.name])) {
        setPending({ field: f, value, required });
        return Promise.resolve();
      }
      queue.current = queue.current.then(() => send(f, value, required));
      return queue.current;
    },
    [send]
  );

  const change = (f: FieldDef, value: unknown, required: boolean) => {
    setRecord((r) => ({ ...r, [f.name]: value }));
    setErrors(({ [f.name]: _, ...rest }) => rest);
    if (commitsOnChange(f)) void commit(f, value, required);
  };

  const confirm = () => {
    if (!pending) return;
    const { field, value, required } = pending;
    setPending(undefined);
    queue.current = queue.current.then(() => send(field, value, required));
  };
  const cancel = () => {
    if (pending) setRecord((r) => ({ ...r, [pending.field.name]: saved.current[pending.field.name] }));
    setPending(undefined);
  };
  return { def, record, errors, state, formError, change, commit, pending, confirm, cancel, restart };
}
