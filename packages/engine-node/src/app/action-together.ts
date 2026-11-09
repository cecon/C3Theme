// Ação em conjunto (`bulk: "together"`): um fato só sobre várias linhas, tudo ou nada (`Hooks.runBulkAction`). O motor
// confere cada registro antes; qualquer recusa recusa o pedido inteiro, com o erro de cada registro barrado.

import type { Action } from '../domain/action-spec';
import type { Entity } from '../domain/entity';
import { ApiError, toApiError } from '../domain/errors';
import type { Rec } from '../domain/types';
import type { ActionOutcome } from '../ports/hooks';
import { checkActionRecord, rereadReply } from './action';
import { checkInput } from './action-input';
import { type ActionReply, buildReply } from './action-reply';
import type { Ctx } from './ctx';
import { parsePathId } from './read';
import { Expect } from './version';

export interface Checked {
  records: Rec[];
  input: Rec;
}

/** Confere todos os ids; com qualquer recusa, nada roda. Um id só devolve o erro dele. */
export async function checkAll(ctx: Ctx, entity: Entity, action: Action, ids: string[], rawInput: Rec, partial: boolean): Promise<Checked> {
  const records: Rec[] = [];
  const refused: [string, ApiError][] = [];
  let input: Rec = {};
  for (const id of ids) {
    try {
      const conn = await ctx.engine.store.conn();
      const [record, owner] = await checkActionRecord(conn, ctx, entity, action, parsePathId(id), new Expect());
      // reference no input confere contra a empresa/filial de cada registro
      input = await checkInput(conn, ctx, action, owner, rawInput, partial);
      records.push(record);
    } catch (e) {
      refused.push([id, toApiError(e)]);
    }
  }
  if (refused.length === 1 && ids.length === 1) throw refused[0][1];
  if (refused.length) throw ApiError.refused(ids.length, refused);
  return { records, input };
}

/** Lote em conjunto: `{ message, open? }` ou o arquivo. Os registros não voltam: a shell relê a lista. */
export async function runTogether(ctx: Ctx, entity: Entity, action: Action, ids: string[], rawInput: Rec): Promise<ActionReply> {
  const { records, input } = await checkAll(ctx, entity, action, ids, rawInput, false);
  const outcome = await call(ctx, entity, action, ids, records, input);
  return buildReply((e) => ctx.engine.entities.has(e), entity, action, outcome);
}

/** A mesma ação rodada no detalhe de um registro: o sistema recebe só ele, e a resposta relê o registro. */
export async function runTogetherOne(
  ctx: Ctx,
  entity: Entity,
  action: Action,
  id: string,
  rowId: number,
  record: Rec,
  input: Rec
): Promise<ActionReply> {
  const outcome = await call(ctx, entity, action, [id], [record], input);
  return rereadReply(ctx, entity, action, rowId, outcome);
}

function call(ctx: Ctx, entity: Entity, action: Action, ids: string[], records: Rec[], input: Rec): Promise<ActionOutcome> {
  return ctx.engine.hooks.runBulkAction({
    entity: entity.name,
    action: action.name,
    ids,
    records,
    input,
    ctx: ctx.requestContext(),
    store: ctx.engine.store
  });
}
