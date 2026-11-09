// Conferência completa de uma gravação: `rowAccess`, campos, `Hooks.validate` e as listas `with_parent`. Os erros
// das linhas voltam junto com os do pai, numa resposta só.

import type { Entity } from '../domain/entity';
import { ApiError, FieldErrors } from '../domain/errors';
import type { Rec, SqlValue } from '../domain/types';
import type { Conn } from '../ports/store';
import type { Sent } from './children';
import { type Plan, planChildren, toWrites } from './children-write';
import type { Ctx, Owner } from './ctx';
import { checkRow } from './row-access';
import { checkFields } from './validation';

/** Valida o registro completo e devolve as colunas graváveis (na ordem de `writable()`) e o plano das filhas. */
export async function checkRecord(
  conn: Conn,
  ctx: Ctx,
  entity: Entity,
  owner: Owner,
  record: Rec,
  parentId: number | undefined,
  kids: Sent
): Promise<[SqlValue[], Plan]> {
  // fora do rowAccess nem adianta validar: o usuário não enxergaria o que gravou
  checkRow(ctx, entity, record);
  const errors = new FieldErrors();
  const values = await checkFields(conn, ctx, entity, owner, record, parentId !== undefined, errors);
  if (errors.isEmpty()) await ctx.engine.hooks.validate(ctx.requestContext(), entity.name, record, conn, errors);
  const plan = await planChildren(conn, ctx, entity, record, owner, parentId, kids, errors);
  if (errors.isEmpty() && plan.length) {
    const lists = toWrites(ctx, entity, plan);
    await ctx.engine.hooks.validateChildren(ctx.requestContext(), entity.name, record, lists, conn, errors);
  }
  if (!errors.isEmpty()) throw ApiError.validation(errors);
  return [values, plan];
}
