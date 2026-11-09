// Condições da spec (spec/README.md#condições): parse validado contra a entidade, avaliação em memória
// (visibleWhen/requiredWhen) e tradução para SQL (listagem, em condition-sql.ts).
//
// As duas precisam concordar com spec/v0/conformance/conditions.json, inclusive em campo vazio: `ne` é verdadeiro e
// o resto é falso. Por isso cada folha SQL devolve sempre 0 ou 1, nunca NULL.

import { type Entity, conditionField } from './entity';
import type { Field } from './field';
import { type FieldType, type Rec, type SqlValue, isObject, isTextual } from './types';
import { isEmpty, isIntColumn, toSql } from './value';

export type Op = 'eq' | 'ne' | 'lt' | 'lte' | 'gt' | 'gte' | 'in' | 'contains' | 'null';

const OPS: readonly Op[] = ['eq', 'ne', 'lt', 'lte', 'gt', 'gte', 'in', 'contains', 'null'];

function allowed(op: Op, ty: FieldType): boolean {
  switch (op) {
    case 'eq':
    case 'ne':
      return ty !== 'file';
    case 'null':
      return true;
    case 'lt':
    case 'lte':
    case 'gt':
    case 'gte':
      return ty === 'integer' || ty === 'decimal' || ty === 'date' || ty === 'datetime';
    case 'in':
      return ty !== 'boolean' && ty !== 'file';
    case 'contains':
      return isTextual(ty);
  }
}

export type Condition =
  | { kind: 'and'; items: Condition[] }
  | { kind: 'or'; items: Condition[] }
  | { kind: 'not'; inner: Condition }
  | {
      kind: 'leaf';
      field: string;
      /** Coluna INTEGER: vazio é só NULL. */
      intCol: boolean;
      op: Op;
      /** Valores já convertidos para a coluna (um só, exceto em `in`). Vazio em `null` e `contains`. */
      values: SqlValue[];
      /** `null`: true/false. `contains`: o texto procurado. */
      arg: boolean | string | null;
    };

function convert(field: Field, v: unknown): SqlValue | undefined {
  const r = toSql(field, v);
  return r.ok && r.value !== null ? r.value : undefined;
}

export function parseCondition(v: unknown, entity: Entity): Condition {
  if (!isObject(v)) throw new Error('condição precisa ser um objeto');
  const list = (items: unknown): Condition[] => {
    if (!Array.isArray(items) || items.length === 0) throw new Error('and/or precisam de uma lista não vazia');
    return items.map((c) => parseCondition(c, entity));
  };
  const keys = Object.keys(v);
  if (keys.length === 1) {
    if ('and' in v) return { kind: 'and', items: list(v.and) };
    if ('or' in v) return { kind: 'or', items: list(v.or) };
    if ('not' in v) return { kind: 'not', inner: parseCondition(v.not, entity) };
  }
  if (keys.length !== 3) throw new Error('condição deve ser {and}, {or}, {not} ou {field, op, value}');
  const name = v.field;
  if (typeof name !== 'string') throw new Error("'field' ausente");
  const field = conditionField(entity, name);
  if (!field) throw new Error(`campo inexistente '${name}'`);
  const opName = v.op;
  if (typeof opName !== 'string') throw new Error("'op' ausente");
  if (!OPS.includes(opName as Op)) throw new Error(`operador desconhecido '${opName}'`);
  const op = opName as Op;
  if (!allowed(op, field.type)) throw new Error(`operador '${op}' não vale para '${name}' (${field.type})`);
  if (!('value' in v)) throw new Error("'value' ausente");
  const value = v.value;
  const bad = () => new Error(`valor de '${name}' fora do formato do tipo`);
  let values: SqlValue[] = [];
  let arg: boolean | string | null = null;
  if (op === 'null') {
    if (typeof value !== 'boolean') throw new Error("'null' espera true/false");
    arg = value;
  } else if (op === 'contains') {
    if (typeof value !== 'string' || value === '') throw bad();
    arg = value;
  } else if (op === 'in') {
    if (!Array.isArray(value) || value.length === 0) throw new Error("'in' espera uma lista não vazia");
    values = value.map((x) => {
      const c = convert(field, x);
      if (c === undefined) throw bad();
      return c;
    });
  } else {
    const c = convert(field, value);
    if (c === undefined) throw bad();
    values = [c];
  }
  return { kind: 'leaf', field: name, intCol: isIntColumn(field), op, values, arg };
}

/** Avalia sobre um registro no formato trafegado (estado do formulário ou registro lido). */
export function evalCondition(c: Condition, record: Rec, entity: Entity): boolean {
  switch (c.kind) {
    case 'and':
      return c.items.every((x) => evalCondition(x, record, entity));
    case 'or':
      return c.items.some((x) => evalCondition(x, record, entity));
    case 'not':
      return !evalCondition(c.inner, record, entity);
    case 'leaf': {
      let raw = record[c.field];
      if (isObject(raw)) raw = raw.id ?? null; // reference lido vem { id, title }
      if (c.op === 'null') return isEmpty(raw) === (c.arg === true);
      if (isEmpty(raw)) return c.op === 'ne';
      const f = conditionField(entity, c.field)!;
      const actual = convert(f, raw);
      if (actual === undefined) return false;
      switch (c.op) {
        case 'contains':
          return typeof actual === 'string' && actual.toLowerCase().includes(String(c.arg).toLowerCase());
        case 'in':
          return c.values.includes(actual);
        case 'eq':
          return actual === c.values[0];
        case 'ne':
          return actual !== c.values[0];
        default: {
          const b = c.values[0];
          if (typeof actual !== typeof b) return false;
          const ord = actual! < b! ? -1 : actual! > b! ? 1 : 0;
          if (c.op === 'lt') return ord < 0;
          if (c.op === 'lte') return ord <= 0;
          if (c.op === 'gt') return ord > 0;
          return ord >= 0;
        }
      }
    }
  }
}

/** Campos citados numa condição. */
export function citedFields(c: Condition): string[] {
  switch (c.kind) {
    case 'and':
    case 'or':
      return c.items.flatMap(citedFields);
    case 'not':
      return citedFields(c.inner);
    case 'leaf':
      return [c.field];
  }
}
