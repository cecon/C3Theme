// `rowAccess` aplicado: o filtro SQL das linhas que o usuário vê e a conferência do registro gravado.

import { type Condition, evalCondition, parseCondition } from '../domain/condition';
import { literalSql } from '../domain/condition-sql';
import type { Entity } from '../domain/entity';
import { ApiError } from '../domain/errors';
import { type RowRule, mapUserLeaves } from '../domain/row-access';
import type { Rec } from '../domain/types';
import type { Ctx } from './ctx';

/** A condição para o usuário da requisição; undefined = não vê nenhuma linha por esta regra. */
function ruleCondition(ctx: Ctx, entity: Entity, r: RowRule): Condition | undefined {
  if (r.fixed) return r.fixed;
  const resolved = mapUserLeaves(r.raw, (leaf, key) => {
    const v = ctx.engine.hooks.userValue(key, ctx.req);
    return v === undefined || v === null ? undefined : { ...leaf, value: v };
  });
  if (resolved === undefined) return undefined;
  try {
    return parseCondition(resolved, entity);
  } catch (e) {
    console.error(`c3-engine-node: ${entity.name}.rowAccess (${r.permission}): valor de $user inválido: ${(e as Error).message}`);
    return undefined;
  }
}

const rulesOf = (ctx: Ctx, entity: Entity): RowRule[] => ctx.engine.rowAccess.get(entity.name) ?? [];

/** `rowAccess` como SQL sobre `alias`, com valores literais. undefined = sem `rowAccess`; sem código, nenhuma linha. */
export function rowFilter(ctx: Ctx, entity: Entity, alias: string): string | undefined {
  const rules = rulesOf(ctx, entity);
  if (!rules.length) return undefined;
  const parts = rules
    .filter((r) => ctx.permitted(r.permission))
    .map((r) => ruleCondition(ctx, entity, r))
    .filter((c): c is Condition => c !== undefined)
    .map((c) => literalSql(c, alias));
  return parts.length ? `(${parts.join(' OR ')})` : '0';
}

/** O registro gravado fica dentro do `rowAccess` do usuário? Fora dele, 403. */
export function checkRow(ctx: Ctx, entity: Entity, record: Rec): void {
  const rules = rulesOf(ctx, entity);
  if (!rules.length) return;
  const inside = rules.some((r) => {
    if (!ctx.permitted(r.permission)) return false;
    const c = ruleCondition(ctx, entity, r);
    return c !== undefined && evalCondition(c, record, entity);
  });
  if (!inside) throw ApiError.forbidden('Você não tem permissão para gravar um registro assim.');
}
