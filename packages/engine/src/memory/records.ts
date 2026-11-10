// Leitura e escrita de registros em memória no formato trafegado (spec/v0/openapi.yaml): reference sai { id, title },
// entra só o id; filhas `with_parent` saem no registro do pai, na chave da entidade filha. Sem React e sem rede.

import { evaluate } from '../conditions.mjs';
import { ApiError } from '../api';
import type { Condition, EntityDef, FieldDef, FieldErrors, FieldType, WireRecord } from '../types';
import { fieldDefault } from '../fieldDefault';

/** Registros gravados de cada entidade, como o "banco" do adaptador: reference guardado só pelo id. */
export type Tables = Record<string, WireRecord[]>;

export const fieldTypes = (def: EntityDef): Record<string, FieldType> => Object.fromEntries(def.fields.map((f) => [f.name, f.type]));

/** Título do registro apontado: o `titleField` da entidade, ou o id. */
export function titleOf(def: EntityDef | undefined, row: WireRecord | undefined): string | null {
  if (!row) return null;
  const v = def?.titleField ? row[def.titleField] : undefined;
  return v === undefined || v === null ? String(row.id) : String(v);
}

const refId = (v: unknown): unknown => (v && typeof v === 'object' && 'id' in v ? (v as { id: unknown }).id : v);

export interface Store {
  defs: Record<string, EntityDef>;
  tables: Tables;
  nextId: () => string;
}

export function def(store: Store, entity: string): EntityDef {
  const d = store.defs[entity];
  if (!d) throw new ApiError(404, 'not_found', `Entidade '${entity}' não existe.`);
  return d;
}

/** Filhas gravadas junto com o pai: [entidade filha, campo que aponta o pai]. */
export function withParentChildren(d: EntityDef): [string, string][] {
  return (d.views?.form?.sections ?? []).flatMap((s) =>
    s.related?.save === 'with_parent' ? [[s.related.entity, s.related.field] as [string, string]] : []
  );
}

/** Registro gravado → trafegado (reference com título, filhas with_parent junto). */
export function toWire(store: Store, entity: string, row: WireRecord, withChildren = true): WireRecord {
  const d = def(store, entity);
  const out: WireRecord = { ...row };
  for (const f of d.fields) {
    if (f.type !== 'reference' || !f.entity) continue;
    const id = row[f.name];
    if (id === null || id === undefined || id === '') {
      out[f.name] = null;
      continue;
    }
    const target = store.tables[f.entity]?.find((r) => r.id === String(id));
    out[f.name] = { id: String(id), title: titleOf(store.defs[f.entity], target) };
  }
  if (withChildren)
    for (const [child, field] of withParentChildren(d))
      out[child] = (store.tables[child] ?? []).filter((r) => String(r[field]) === row.id).map((r) => toWire(store, child, r, false));
  return out;
}

/** Condição sobre o registro trafegado (o avaliador da spec aceita reference { id, title }). */
export function matches(d: EntityDef, row: WireRecord, where: Condition | undefined): boolean {
  return !where || evaluate(where, row, fieldTypes(d));
}

const empty = (v: unknown) => v === null || v === undefined || v === '';

/** O que o backend recusa sem regra de negócio: obrigatório vazio, texto acima do limite, número fora da faixa. */
export function validate(d: EntityDef, record: WireRecord, prefix = ''): FieldErrors {
  const errors: FieldErrors = {};
  const add = (f: FieldDef, code: string, message: string) => (errors[prefix + f.name] ??= []).push({ code, message });
  for (const f of d.fields) {
    if (f.readOnly) continue;
    const v = record[f.name];
    if (f.required && empty(v)) add(f, 'required', 'Campo obrigatório.');
    if (typeof v === 'string' && f.maxLength && v.length > f.maxLength) add(f, 'max_length', `No máximo ${f.maxLength} caracteres.`);
    if (!empty(v) && (f.type === 'integer' || f.type === 'decimal')) {
      const n = Number(v);
      if (f.min !== undefined && n < f.min) add(f, 'min', `O mínimo é ${f.min}.`);
      if (f.max !== undefined && n > f.max) add(f, 'max', `O máximo é ${f.max}.`);
    }
  }
  return errors;
}

/** Campos graváveis do corpo, com o default da spec no que não veio (criação). */
export function fromInput(d: EntityDef, input: WireRecord, base: WireRecord = {}, creating = false): WireRecord {
  const out: WireRecord = { ...base };
  for (const f of d.fields) {
    if (f.name in input && !f.readOnly) out[f.name] = refId(input[f.name]);
    else if (creating && !(f.name in out)) out[f.name] = fieldDefault(f) ?? null;
  }
  return out;
}

/** Registro inicial (seed): todos os campos, inclusive os readOnly que só o sistema grava; reference só o id. */
export function fromSeed(d: EntityDef, row: WireRecord): WireRecord {
  const out: WireRecord = { ...row };
  for (const f of d.fields) out[f.name] = f.name in row ? refId(row[f.name]) : (fieldDefault(f) ?? null);
  return out;
}

/** Erros das linhas with_parent do corpo, na chave `{filha}.{posição}.{campo}`. */
export function validateChildren(store: Store, entity: string, input: WireRecord): FieldErrors {
  const errors: FieldErrors = {};
  for (const [child, field] of withParentChildren(def(store, entity))) {
    const rows = input[child];
    if (!Array.isArray(rows)) continue;
    const cd = def(store, child);
    const own = { ...cd, fields: cd.fields.filter((f) => f.name !== field) };
    rows.forEach((r: WireRecord, i: number) => Object.assign(errors, validate(own, r, `${child}.${i}.`)));
  }
  return errors;
}

/** Grava as filhas with_parent do corpo: a lista substitui a gravada (com id altera, sem id inclui). */
export function saveChildren(store: Store, entity: string, parentId: string, input: WireRecord) {
  for (const [child, field] of withParentChildren(def(store, entity))) {
    const rows = input[child];
    if (!Array.isArray(rows)) continue;
    const cd = def(store, child);
    const table = (store.tables[child] ??= []);
    const old = table.filter((r) => String(r[field]) === parentId);
    const kept = rows.map((r: WireRecord) => {
      const prev = old.find((o) => o.id === r.id);
      return { ...fromInput(cd, r, prev ?? {}, !prev), [field]: parentId, id: prev?.id ?? store.nextId() };
    });
    store.tables[child] = [...table.filter((r) => String(r[field]) !== parentId), ...kept];
  }
}

export function fail(errors: FieldErrors): never {
  throw new ApiError(422, 'validation_failed', 'Confira os campos destacados.', errors);
}
