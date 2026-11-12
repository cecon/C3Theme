import { useState } from 'react';

import { evaluate, type FieldType } from '../../conditions.mjs';
import { commitsOnChange } from '../../hooks/useAutosave';
import type { FieldDef, WireRecord } from '../../types';

interface Autosave {
  record: WireRecord;
  change: (f: FieldDef, value: unknown, required: boolean) => void;
  commit: (f: FieldDef, value: unknown, required: boolean) => Promise<void>;
  differs: (f: FieldDef, value: unknown) => boolean;
  revert: (f: FieldDef) => void;
}

export interface PendingChange {
  field: FieldDef;
  value: unknown;
  required: boolean;
}

/**
 * Confirmação de alteração sensível (`confirmChange`, #110) na gravação na hora: o valor novo só vai para o PATCH
 * depois do Confirmar. Switch e select perguntam ao mudar (o valor na tela ainda é o gravado); texto pergunta ao sair
 * do campo, e Cancelar volta o que foi digitado.
 */
export default function useGuardedChange(a: Autosave, types: Record<string, FieldType>) {
  const [pending, setPending] = useState<PendingChange>();
  const asks = (f: FieldDef, value: unknown) => {
    const c = f.confirmChange;
    return Boolean(c) && a.differs(f, value) && (!c!.when || evaluate(c!.when, { ...a.record, [f.name]: value }, types));
  };

  const change = (f: FieldDef, value: unknown, required: boolean) => {
    if (commitsOnChange(f) && asks(f, value)) setPending({ field: f, value, required });
    else a.change(f, value, required);
  };
  const commit = (f: FieldDef, value: unknown, required: boolean) => {
    if (asks(f, value)) setPending({ field: f, value, required });
    else void a.commit(f, value, required);
  };
  const confirm = () => {
    if (!pending) return;
    const { field, value, required } = pending;
    setPending(undefined);
    if (commitsOnChange(field)) a.change(field, value, required);
    else void a.commit(field, value, required);
  };
  const cancel = () => {
    if (pending) a.revert(pending.field);
    setPending(undefined);
  };
  return { pending, change, commit, confirm, cancel };
}
