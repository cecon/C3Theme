// Os casos de spec/v0/conformance (os mesmos do c3-engine e da shell): condição em memória e em SQL, datas relativas
// e documentos. Mudar a regra num motor sem mudar no outro quebra aqui.
import { readFileSync } from 'node:fs';

import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';

import { prepareConnection } from '../adapters/better-sqlite3';
import { citedFields, evalCondition, parseCondition } from './condition';
import { conditionSql, literalSql } from './condition-sql';
import { type DocFormat, documentError } from './document';
import { parseEntity } from './entity';
import { resolveRelative } from './relative-date';
import type { Rec, SqlValue } from './types';
import { toSql } from './value';

const suite = <T>(file: string): T =>
  JSON.parse(readFileSync(new URL(`../../../../spec/v0/conformance/${file}`, import.meta.url), 'utf8')) as T;

interface ConditionSuite {
  types: Record<string, string>;
  enumOptions: Record<string, { value: unknown }[]>;
  cases: { name: string; record: Rec; where: unknown; expected: boolean }[];
}
const cond = suite<ConditionSuite>('conditions.json');
const fields = Object.entries(cond.types).map(([name, type]) =>
  type === 'enum' || type === 'flags'
    ? { name, type, options: cond.enumOptions[name].map((o) => ({ ...o, label: String(o.value) })) }
    : type === 'reference'
      ? { name, type, entity: 'company' }
      : { name, type }
);
const [entity] = parseEntity({ name: 't', fields });

// a mesma condição no SQLite: uma linha com o registro, a folha vale 0 ou 1
const db = new Database(':memory:');
prepareConnection(db);
db.exec(
  `CREATE TABLE t (id INTEGER PRIMARY KEY, ${Object.keys(cond.types)
    .map((n) => `"${n}"`)
    .join(', ')})`
);
function sqlEval(record: Rec, where: unknown): boolean {
  db.exec('DELETE FROM t');
  const cols: string[] = [];
  const vals: SqlValue[] = [];
  for (const [k, raw] of Object.entries(record)) {
    // reference lido vem { id, title }; no banco é o id
    const v = raw !== null && typeof raw === 'object' ? (raw as Rec).id : raw;
    const f = k === 'id' ? undefined : entity.fields.find((x) => x.name === k)!;
    const c = f ? toSql(f, v) : { ok: true as const, value: Number(v) };
    cols.push(`"${k}"`);
    vals.push(c.ok ? c.value : null);
  }
  db.prepare(`INSERT INTO t (${cols.join(', ') || 'id'}) VALUES (${cols.length ? vals.map(() => '?').join(', ') : 'NULL'})`).run(...vals);
  const params: SqlValue[] = [];
  const sql = conditionSql(parseCondition(where, entity), 't', params);
  const viaParams = (db.prepare(`SELECT ${sql} AS ok FROM t`).get(...params) as { ok: number }).ok;
  const viaLiteral = (db.prepare(`SELECT ${literalSql(parseCondition(where, entity), 't')} AS ok FROM t`).get() as { ok: number }).ok;
  expect(viaLiteral).toBe(viaParams);
  return viaParams === 1;
}

describe('condições (conditions.json)', () => {
  it.each(cond.cases.map((c) => [c.name, c] as const))('%s', (_, c) => {
    const parsed = parseCondition(c.where, entity);
    expect(evalCondition(parsed, c.record, entity)).toBe(c.expected);
    expect(sqlEval(c.record, c.where)).toBe(c.expected);
  });

  it('reference lido ({id, title}) vale pelo id', () => {
    const c = parseCondition({ field: 'company_id', op: 'eq', value: '3' }, entity);
    expect(evalCondition(c, { company_id: { id: '3', title: 'Alfa' } }, entity)).toBe(true);
  });

  it('and, or e not juntos, e a lista de campos citados', () => {
    const where = { or: [{ not: { field: 'vip', op: 'eq', value: true } }, { and: [{ field: 'age', op: 'gte', value: 18 }] }] };
    const c = parseCondition(where, entity);
    expect(citedFields(c)).toEqual(['vip', 'age']);
    expect(evalCondition(c, { vip: true, age: 20 }, entity)).toBe(true);
    expect(evalCondition(c, { vip: true, age: 10 }, entity)).toBe(false);
    expect(sqlEval({ vip: true, age: 10 }, where)).toBe(false);
  });

  it.each([
    ['operador que o tipo não aceita', { field: 'vip', op: 'gt', value: true }],
    ['campo que não existe', { field: 'nope', op: 'eq', value: 'a' }],
    ['valor fora do tipo', { field: 'age', op: 'eq', value: 'x' }],
    ['in vazio', { field: 'name', op: 'in', value: [] }],
    ['in com valor fora do tipo', { field: 'age', op: 'in', value: ['x'] }],
    ['and vazio', { and: [] }],
    ['chave a mais', { field: 'name', op: 'eq', value: 'a', extra: 1 }],
    ['sem op', { field: 'name', x: 1, value: 'a' }],
    ['op desconhecido', { field: 'name', op: 'like', value: 'a' }],
    ['null sem booleano', { field: 'name', op: 'null', value: 'sim' }],
    ['contains vazio', { field: 'name', op: 'contains', value: '' }],
    ['sem value', { field: 'name', op: 'eq', x: 1 }],
    ['não é objeto', 'name = 1']
  ])('recusa %s', (_, where) => {
    expect(() => parseCondition(where, entity)).toThrow();
  });
});

interface DateSuite {
  cases: {
    clock: { now: string; utcOffsetMinutes: number; today?: string };
    type: string;
    op: string;
    value: Rec;
    expected?: string;
    error?: boolean;
    note?: string;
  }[];
}
const dates = suite<DateSuite>('relative-dates.json');
const [dated] = parseEntity({
  name: 'd',
  fields: [
    { name: 'date', type: 'date' },
    { name: 'datetime', type: 'datetime' },
    { name: 'string', type: 'string' }
  ]
});

describe('datas relativas (relative-dates.json)', () => {
  it.each(dates.cases.map((c) => [`${c.type} ${c.op} ${JSON.stringify(c.value)} ${c.note ?? ''}`, c] as const))('%s', (_, c) => {
    const clock = { now: Date.parse(c.clock.now) / 1000, utcOffsetMinutes: c.clock.utcOffsetMinutes, today: c.clock.today };
    // o tipo do caso é o nome do campo na entidade de teste
    const run = () =>
      (resolveRelative({ and: [{ field: c.type, op: c.op, value: c.value }] }, dated, clock) as { and: Rec[] }).and[0].value;
    if (c.error) expect(run).toThrow();
    else expect(run()).toBe(c.expected);
  });

  it('valor comum e not passam iguais; today inválido do relógio é erro', () => {
    const clock = { now: 0, utcOffsetMinutes: 0 };
    const where = { not: { field: 'date', op: 'eq', value: '2026-01-01' } };
    expect(resolveRelative(where, dated, clock)).toEqual(where);
    expect(resolveRelative('x', dated, clock)).toBe('x');
    const bad = () => resolveRelative({ field: 'date', op: 'eq', value: { $date: 'today' } }, dated, { ...clock, today: '2026-02-30' });
    expect(bad).toThrow(/today inválido/);
  });
});

describe('documentos (documents.json)', () => {
  const docs = suite<{ cases: { format: DocFormat; value: string; error: string | null; note?: string }[] }>('documents.json');
  it.each(docs.cases.map((c) => [`${c.format} ${c.value} ${c.note ?? ''}`, c] as const))('%s', (_, c) => {
    expect(documentError(c.format, c.value) ?? null).toBe(c.error);
  });
});
