// Ação em conjunto (`bulk: "together"`): um fato só sobre várias linhas, tudo ou nada (`Hooks.runBulkAction`). O motor
// confere cada registro antes; qualquer recusa recusa o pedido inteiro, com o erro de cada registro barrado.

import type { Action } from '../domain/action-spec';
import type { Entity } from '../domain/entity';
import { ApiError, toApiError } from '../domain/errors';
import type { Rec } from '../domain/types';
import type { ActionOutcome } from '../ports/hooks';
import { checkActionRecord, checkLoaded, rereadReply } from './action';
import { checkInput, checkSelection } from './action-input';
import { type ActionReply, buildReply } from './action-reply';
import type { Ctx } from './ctx';
import { parsePathId } from './read';
import { pickedRows } from './source';
import { Expect } from './version';

export interface Checked {
  records: Rec[];
  input: Rec;
  /** Consulta do sistema: os parâmetros com que as linhas foram lidas (vazio numa tabela). */
  params: Rec;
}

/** Confere todos os ids; com qualquer recusa, nada roda. Um id só devolve o erro dele. */
export async function checkAll(ctx: Ctx, entity: Entity, action: Action, ids: string[], rawInput: Rec, partial: boolean): Promise<Checked> {
  const records: Rec[] = [];
  const refused: [string, ApiError][] = [];
  let input: Rec = {};
  // consulta do sistema: as linhas vêm da consulta com os parâmetros da URL, lida uma vez só
  const wanted = ids.flatMap((i) => (/^[1-9]\d*$/.test(i) ? [Number(i)] : []));
  const [picked, params] = entity.source ? await pickedRows(ctx, entity, entity.source, wanted) : [undefined, {}];
  for (const id of ids) {
    try {
      const conn = await ctx.engine.store.conn();
      const rowId = parsePathId(id);
      const row = picked?.get(rowId);
      if (picked && !row) throw ApiError.notFound('Registro não encontrado.');
      const [record, owner] = row
        ? checkLoaded(ctx, entity, action, row, new Expect())
        : await checkActionRecord(conn, ctx, entity, action, rowId, new Expect());
      // reference no input confere contra a empresa/filial de cada registro
      input = await checkInput(conn, ctx, action, owner, rawInput, partial);
      records.push(record);
    } catch (e) {
      refused.push([id, toApiError(e)]);
    }
  }
  if (refused.length === 1 && ids.length === 1) throw refused[0][1];
  if (refused.length) throw ApiError.refused(ids.length, refused);
  if (!partial) checkSelection(action.grids, input, ids);
  return { records, input, params };
}

/** Lote em conjunto: `{ message, open? }` ou o arquivo. Os registros não voltam: a shell relê a lista. */
export async function runTogether(ctx: Ctx, entity: Entity, action: Action, ids: string[], rawInput: Rec): Promise<ActionReply> {
  const { records, input, params } = await checkAll(ctx, entity, action, ids, rawInput, false);
  const outcome = await call(ctx, entity, action, ids, records, input, params);
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
  const outcome = await call(ctx, entity, action, [id], [record], input, {});
  return rereadReply(ctx, entity, action, rowId, outcome);
}

function call(ctx: Ctx, entity: Entity, action: Action, ids: string[], records: Rec[], input: Rec, params: Rec): Promise<ActionOutcome> {
  return ctx.engine.hooks.runBulkAction({
    entity: entity.name,
    action: action.name,
    ids,
    records,
    input,
    params,
    ctx: ctx.requestContext(),
    store: ctx.engine.store
  });
}
