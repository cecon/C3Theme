// `rowAccess`: as linhas que cada código de permissão enxerga. O usuário vê a união dos `where` dos códigos que tem;
// um valor `{"$user": chave}` vem do usuário logado (`Hooks.userValue`). Aqui a declaração; a aplicação fica em app/.

import { type Condition, parseCondition } from './condition';
import type { Entity } from './entity';
import { type Rec, isObject } from './types';

export interface RowRule {
  permission: string;
  /** O `where` como veio; com `$user`, resolvido a cada requisição. */
  raw: unknown;
  /** Já interpretado, quando não cita o usuário. */
  fixed?: Condition;
}

const USER_OPS = ['eq', 'ne', 'in'];

export function parseRowRules(entity: Entity): RowRule[] {
  const rules = Array.isArray(entity.raw.rowAccess) ? entity.raw.rowAccess : [];
  return rules.map((r, i) => {
    const label = `${entity.name}.rowAccess[${i}]`;
    const permission = isObject(r) && typeof r.permission === 'string' ? r.permission : undefined;
    if (permission === undefined) throw new Error(`${label}: falta permission`);
    const raw = (r as Rec).where ?? null;
    // no boot, cada folha com `$user` vira "campo vazio" só para conferir o resto (campo, tipo, operadores)
    let citesUser = false;
    let badOp = false;
    const probe = mapUserLeaves(raw, (leaf) => {
      citesUser = true;
      if (!USER_OPS.includes(String(leaf.op))) badOp = true;
      return { field: leaf.field, op: 'null', value: true };
    });
    if (badOp) throw new Error(`${label}.where: $user só vale com eq, ne e in`);
    let cond: Condition;
    try {
      cond = parseCondition(probe ?? null, entity);
    } catch (e) {
      throw new Error(`${label}.where: ${(e as Error).message}`, { cause: e });
    }
    return { permission, raw, fixed: citesUser ? undefined : cond };
  });
}

/** Copia a condição passando cada folha `{"$user": chave}` por `f`; `undefined` de `f` anula a condição inteira. */
export function mapUserLeaves(c: unknown, f: (leaf: Rec, key: string) => Rec | undefined): unknown {
  if (!isObject(c)) return c;
  for (const k of ['and', 'or']) {
    if (Array.isArray(c[k])) {
      const items: unknown[] = [];
      for (const i of c[k] as unknown[]) {
        const m = mapUserLeaves(i, f);
        if (m === undefined) return undefined;
        items.push(m);
      }
      return { [k]: items };
    }
  }
  if ('not' in c) {
    const inner = mapUserLeaves(c.not, f);
    return inner === undefined ? undefined : { not: inner };
  }
  const key = isObject(c.value) ? c.value.$user : undefined;
  return typeof key === 'string' ? f(c, key) : c;
}
