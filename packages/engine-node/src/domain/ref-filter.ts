// Filtro no reference: `filter` num campo reference é uma condição sobre a entidade apontada. A lista de opções
// e a validação usam a mesma condição. O valor de uma folha pode ser `{"$field": "cliente_id"}`: o valor desse
// campo no registro de quem aponta. Vazio, a folha não restringe nada.

import { type Condition, parseCondition } from './condition';
import { type Entity, conditionField } from './entity';
import type { Field } from './field';
import { isEmpty } from './value';
import { type Rec, isObject } from './types';

const VAR = '$field';
const ORDERED = ['integer', 'decimal', 'date', 'datetime'];

/** Boot: o filtro do campo `f` de `source`, que aponta para `target`, é uma condição válida sobre `target`. */
export function checkRefFilter(source: Entity, f: Field, target: Entity): void {
  if (f.refFilter === undefined) return;
  const label = `${source.name}.${f.name}.filter`;
  try {
    checkVars(f.refFilter, source, target, false);
    const fixed = resolveRefFilter(f.refFilter, {});
    if (fixed !== undefined) parseCondition(fixed, target);
  } catch (e) {
    throw new Error(`${label}: ${(e as Error).message}`, { cause: e });
  }
}

function checkVars(c: unknown, source: Entity, target: Entity, negated: boolean): void {
  if (!isObject(c)) return;
  for (const key of ['and', 'or']) {
    if (Array.isArray(c[key])) {
      for (const i of c[key] as unknown[]) checkVars(i, source, target, negated);
      return;
    }
  }
  if ('not' in c) return checkVars(c.not, source, target, true);
  if (!isObject(c.value) || !(VAR in c.value)) return;
  const v = c.value[VAR];
  if (typeof v !== 'string') throw new Error("'$field' precisa ser o nome de um campo");
  const name = typeof c.field === 'string' ? c.field : '';
  const op = typeof c.op === 'string' ? c.op : '';
  if (negated) throw new Error(`'$field' não vale dentro de 'not' (use 'ne'): '${name}'`);
  if (!['eq', 'ne', 'lt', 'lte', 'gt', 'gte'].includes(op))
    throw new Error(`'$field' só vale com eq, ne, lt, lte, gt e gte: '${name}' usa '${op}'`);
  const t = conditionField(target, name);
  if (!t) throw new Error(`campo inexistente '${name}'`);
  const s = conditionField(source, v);
  if (!s) throw new Error(`'$field' cita campo inexistente '${v}'`);
  const points = (x: Field, owner: Entity) => x.reference ?? owner.name;
  const same = s.type === t.type && (t.type !== 'reference' || points(s, source) === points(t, target));
  if (!same) throw new Error(`'${v}' e '${name}' precisam ser do mesmo tipo (e apontar para a mesma entidade)`);
  if ((op.startsWith('l') || op.startsWith('g')) && !ORDERED.includes(t.type)) throw new Error(`operador '${op}' não vale para '${name}'`);
}

/** A condição concreta para o registro de quem aponta; `undefined` = nada restringe. */
export function resolveRefFilter(c: unknown, record: Rec): unknown {
  if (!isObject(c)) return c;
  if (Array.isArray(c.and)) {
    const kept = c.and.map((i) => resolveRefFilter(i, record)).filter((x) => x !== undefined);
    return kept.length ? { and: kept } : undefined;
  }
  if (Array.isArray(c.or)) {
    // uma alternativa sem restrição libera tudo
    const kept = c.or.map((i) => resolveRefFilter(i, record));
    return kept.some((x) => x === undefined) ? undefined : { or: kept };
  }
  if ('not' in c) {
    const inner = resolveRefFilter(c.not, record);
    return inner === undefined ? undefined : { not: inner };
  }
  if (!isObject(c.value) || typeof c.value[VAR] !== 'string') return c;
  let v = record[c.value[VAR] as string];
  if (isObject(v)) v = v.id; // reference lido vem { id, title }
  if (isEmpty(v)) return undefined;
  return { ...c, value: v };
}

/** O filtro do campo para este registro, já como condição sobre `target`. Valor fora do formato não filtra. */
export function refCondition(f: Field, record: Rec, target: Entity): Condition | undefined {
  if (f.refFilter === undefined) return undefined;
  const raw = resolveRefFilter(f.refFilter, record);
  if (raw === undefined) return undefined;
  try {
    return parseCondition(raw, target);
  } catch {
    return undefined;
  }
}
