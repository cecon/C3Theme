// Coluna editável na lista (#29, `columns[].edit`): `instant` grava a linha ao mudar; `batch` guarda as mudanças e
// grava tudo no "Salvar alterações", um PATCH por linha. Cada PATCH leva a `_version` que a tela viu (412 se outro
// mudou) e passa pelas mesmas regras do formulário no backend (readOnlyWhen, access, validação).

import { useState } from 'react';

import { ApiError, isStale } from '../../api';
import { useEngine } from '../../context';
import { evaluate } from '../../conditions.mjs';
import { recordOptions } from '../../format';
import { fieldTypes } from '../../sectionVisibility';
import type { EntityDef, FieldDef, WireRecord } from '../../types';

const STALE = 'Este registro mudou depois que a lista abriu. Atualize a lista.';

type RowErrors = Record<string, Record<string, string>>;

export interface InlineEdit {
  /** O valor que a célula mostra: a mudança pendente ou o da linha. */
  value: (row: WireRecord, field: string) => unknown;
  /** A linha com as mudanças pendentes (o `filter` de um reference e o `optionsFrom` leem daqui). */
  draft: (row: WireRecord) => WireRecord;
  error: (row: WireRecord, field: string) => string | undefined;
  /** Campo que esta linha não deixa alterar (sem permissão, readOnly, createOnly, readOnlyWhen sobre o gravado). */
  locked: (row: WireRecord, f: FieldDef) => boolean;
  change: (row: WireRecord, f: FieldDef, mode: 'instant' | 'batch', value: unknown) => void;
  /** Saiu do campo: no `instant`, o que se digitou (texto, número, data) grava agora, não a cada tecla. */
  commit: (row: WireRecord, f: FieldDef) => void;
  /** Linhas com mudança pendente (modo `batch`). */
  pending: number;
  saving: boolean;
  saveAll: () => Promise<void>;
  discard: () => void;
}

/** Campo que se digita (texto, número, data): no `instant`, grava ao sair, não a cada tecla. */
const typed = (f: FieldDef, row: WireRecord) => !['boolean', 'enum', 'reference', 'flags'].includes(f.type) && !recordOptions(f, row);

type Pending = Record<string, { row: WireRecord; patch: WireRecord }>;

const drop = (all: Pending, id: string, field?: string): Pending => {
  const { [id]: mine, ...rest } = all;
  if (!mine || field === undefined) return rest;
  const { [field]: _, ...patch } = mine.patch;
  return Object.keys(patch).length ? { ...rest, [id]: { ...mine, patch } } : rest;
};

/** `onSaved`: relê a lista depois de gravar. */
export default function useInlineEdit(entity: string, def: EntityDef, onSaved: () => void): InlineEdit {
  const { client, entities } = useEngine();
  const canUpdate = Boolean(entities[entity]?.capabilities.update);
  // `batch`: o que espera o "Salvar alterações"; `instant`: o valor novo enquanto o PATCH não volta
  const [batch, setBatch] = useState<Pending>({});
  const [inflight, setInflight] = useState<Pending>({});
  const [typing, setTyping] = useState<Pending>({});
  const [errors, setErrors] = useState<RowErrors>({});
  const [saving, setSaving] = useState(false);
  const types = fieldTypes(def);

  const failed = (id: string, e: unknown, fallback: string) => {
    const fields = e instanceof ApiError && e.fields ? e.fields : {};
    const mine = Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v[0]?.message ?? '']));
    if (!Object.keys(mine).length) mine[fallback] = isStale(e) ? STALE : e instanceof Error ? e.message : String(e);
    setErrors((all) => ({ ...all, [id]: mine }));
  };

  const write = async (row: WireRecord, patch: WireRecord) => {
    const id = row.id!;
    try {
      await client.update(entity, id, patch, { ifMatch: row._version as string | undefined });
      setErrors(({ [id]: _, ...rest }) => rest);
      return true;
    } catch (e) {
      failed(id, e, Object.keys(patch)[0]);
      return false;
    }
  };

  const change: InlineEdit['change'] = (row, f, mode, value) => {
    const id = row.id!;
    setErrors(({ [id]: mine, ...rest }) => {
      const { [f.name]: _, ...left } = mine ?? {};
      return Object.keys(left).length ? { ...rest, [id]: left } : rest;
    });
    const add = (all: Pending): Pending => ({ ...all, [id]: { row, patch: { ...all[id]?.patch, [f.name]: value } } });
    if (mode === 'batch') {
      setBatch(add);
      return;
    }
    if (typed(f, row)) setTyping(add);
    else send(row, f, value);
  };

  const send = (row: WireRecord, f: FieldDef, value: unknown) => {
    const id = row.id!;
    setInflight((all) => ({ ...all, [id]: { row, patch: { ...all[id]?.patch, [f.name]: value } } }));
    void write(row, { [f.name]: value }).then((ok) => {
      // gravou ou não, a célula volta ao que a lista mostra (relida, se gravou); o erro fica na linha
      setInflight((all) => drop(all, id, f.name));
      if (ok) onSaved();
    });
  };

  const commit: InlineEdit['commit'] = (row, f) => {
    const id = row.id!;
    const patch = typing[id]?.patch;
    if (!patch || !(f.name in patch)) return;
    setTyping((all) => drop(all, id, f.name));
    if (patch[f.name] !== row[f.name]) send(row, f, patch[f.name]);
  };

  const patchOf = (row: WireRecord): WireRecord => ({
    ...batch[row.id!]?.patch,
    ...inflight[row.id!]?.patch,
    ...typing[row.id!]?.patch
  });

  return {
    value: (row, field) => {
      const patch = patchOf(row);
      return field in patch ? patch[field] : row[field];
    },
    draft: (row) => ({ ...row, ...patchOf(row) }),
    error: (row, field) => errors[row.id!]?.[field],
    locked: (row, f) =>
      !canUpdate ||
      f.denied === 'readOnly' ||
      Boolean(f.readOnly || f.createOnly || (f.readOnlyWhen && evaluate(f.readOnlyWhen, row, types))),
    change,
    commit,
    pending: Object.keys(batch).length,
    saving,
    saveAll: async () => {
      setSaving(true);
      const saved: string[] = [];
      for (const [id, { row, patch }] of Object.entries(batch)) if (await write(row, patch)) saved.push(id);
      // as que falharam ficam pendentes, com o erro na linha
      setBatch((all) => saved.reduce((acc, id) => drop(acc, id), all));
      setSaving(false);
      if (saved.length) onSaved();
    },
    discard: () => {
      setBatch({});
      setErrors({});
    }
  };
}
