// Ações de registro: `POST /{entity}/{id}/_actions/{action}` e, em lote, `POST /{entity}/_actions/{action}`. O motor
// confere permissão, escopo, `visibleWhen` e input; a execução é do sistema (`Hooks.runAction`).

import type { Action } from '../domain/action-spec';
import { evalCondition } from '../domain/condition';
import { type Entity, actionOf } from '../domain/entity';
import { ApiError, toApiError } from '../domain/errors';
import { type Rec, isObject } from '../domain/types';
import type { ActionOutcome } from '../ports/hooks';
import type { EngineRequest } from '../ports/request';
import type { Conn } from '../ports/store';
import { checkInput, parseActionInput } from './action-input';
import { runListAction } from './action-list';
import { type ActionReply, buildReply } from './action-reply';
import { runTogether, runTogetherOne } from './action-together';
import { Ctx, type Owner, allowRead, ownerOf } from './ctx';
import type { Engine } from './engine';
import { attachCan, fetchOne, parsePathId } from './read';
import { normalizeRefs } from './validation';
import { Expect } from './version';

/** Máximo de registros num pedido em lote. */
export const BULK_LIMIT = 100;

export function findAction(entity: Entity, name: string): Action {
  const a = actionOf(entity, name);
  if (!a) throw ApiError.notFound(`Ação '${name}' não existe.`);
  return a;
}

/** `{ data, message }`: o registro relido depois da ação e o aviso do sistema. `body` é um thunk: o erro de leitura do
 * corpo só vale depois das conferências de rota e permissão. */
export async function runAction(
  engine: Engine,
  req: EngineRequest,
  name: string,
  id: string,
  actionName: string,
  body: () => Rec
): Promise<ActionReply> {
  const entity = engine.entity(name);
  const action = findAction(entity, actionName);
  if (action.list) throw ApiError.notFound(`Ação '${actionName}' é da lista: POST /${name}/_actions/${actionName}.`);
  const ctx = await Ctx.of(engine, req);
  allowRead(ctx, entity, (c) => c.read);
  const rowId = parsePathId(id);
  const expect = Expect.from(req);
  expect.allowUndo(entity, actionName);
  const conn = await engine.store.conn();
  const [record, owner] = await checkActionRecord(conn, ctx, entity, action, rowId, expect);
  const input = await checkInput(conn, ctx, action, owner, parseActionInput(action, body()));
  const reply = action.together
    ? await runTogetherOne(ctx, entity, action, id, rowId, record, input)
    : await execute(ctx, entity, action, id, rowId, record, input);
  // a ação pode ter mudado, tirado do escopo ou apagado o registro: quem está com a tela aberta relê
  engine.emit(name, id, 'updated');
  return reply;
}

/** Lote: a mesma ação, com o mesmo input, em cada registro; cada um é independente. */
export async function runBulk(engine: Engine, req: EngineRequest, name: string, actionName: string, body: () => Rec): Promise<ActionReply> {
  const entity = engine.entity(name);
  const action = findAction(entity, actionName);
  if (action.list) {
    const reply = await runListAction(engine, entity, action, req, body);
    engine.emit(name, undefined, 'changed');
    return reply;
  }
  if (!action.bulk) throw ApiError.notFound(`Ação '${actionName}' não roda em lote.`);
  const ctx = await Ctx.of(engine, req);
  allowRead(ctx, entity, (c) => c.read);
  const [ids, input] = bulkBody(body());
  // o input é um só: erro nele vale para todos e volta como 422, antes de tocar em qualquer registro
  const rawInput = parseActionInput(action, input);
  await checkInput(await engine.store.conn(), ctx, action, {}, rawInput);
  if (action.together) {
    const reply = await runTogether(ctx, entity, action, ids, rawInput);
    engine.emit(name, undefined, 'changed');
    return reply;
  }
  const results: Rec[] = [];
  let done = 0;
  for (const id of ids) {
    try {
      const rowId = parsePathId(id);
      const conn = await engine.store.conn();
      const [record, owner] = await checkActionRecord(conn, ctx, entity, action, rowId, new Expect());
      // reference no input confere de novo contra a empresa/filial de cada registro
      const checked = await checkInput(conn, ctx, action, owner, rawInput);
      const reply = await execute(ctx, entity, action, id, rowId, record, checked);
      if (reply.kind === 'file') throw ApiError.internal();
      const v: Rec = { ...reply.body };
      delete v.open; // em lote a shell fica na lista
      done += 1;
      engine.emit(name, id, 'updated');
      results.push({ ...v, id, ok: true });
    } catch (e) {
      const err = toApiError(e);
      results.push({ id, ok: false, error: err.body() });
    }
  }
  return { kind: 'json', body: { results, meta: { ok: done, failed: ids.length - done } } };
}

/** Corpo do lote: `{ ids, input }`, com 1 a `BULK_LIMIT` ids sem repetição. */
export function bulkBody(body: Rec): [string[], Rec] {
  const bad = () => ApiError.badRequest(`Corpo precisa ser { "ids": [...], "input": {...} } com 1 a ${BULK_LIMIT} ids.`);
  const unknown = Object.keys(body).find((k) => k !== 'ids' && k !== 'input');
  if (unknown !== undefined) throw ApiError.badRequest(`Campo desconhecido '${unknown}'.`);
  const ids = body.ids;
  if (!Array.isArray(ids) || !ids.every((x) => typeof x === 'string')) throw bad();
  if (!ids.length || ids.length > BULK_LIMIT || new Set(ids).size !== ids.length) throw bad();
  const input = body.input;
  if (input !== undefined && input !== null && !isObject(input)) throw ApiError.badRequest('input precisa ser um objeto JSON.');
  return [ids as string[], isObject(input) ? input : {}];
}

/** Registro no escopo (404), permissão da ação na filial dona (403), versão (412), `visibleWhen` (409). */
export async function checkActionRecord(
  conn: Conn,
  ctx: Ctx,
  entity: Entity,
  action: Action,
  rowId: number,
  expect: Expect
): Promise<[Rec, Owner]> {
  const record = await fetchOne(conn, ctx, entity, rowId);
  if (!record) throw ApiError.notFound('Registro não encontrado.');
  const owner = ownerOf(record);
  const branch = entity.scope === 'branch' ? owner.branch : ctx.active()?.id;
  const allowed =
    ctx.canWrite(entity, owner, (c) => c.read) &&
    ctx.engine.hooks.actionAllowed(entity.name, action.name, branch === undefined ? undefined : String(branch), ctx.req);
  if (!allowed) throw ApiError.forbidden();
  expect.check(ctx, entity, record);
  const plain = { ...record };
  normalizeRefs(entity, plain);
  if (action.visibleWhen && !evalCondition(action.visibleWhen, plain, entity))
    throw ApiError.conflict('Esta ação não está disponível para este registro.');
  return [record, owner];
}

async function execute(ctx: Ctx, entity: Entity, action: Action, id: string, rowId: number, record: Rec, input: Rec): Promise<ActionReply> {
  const outcome = await ctx.engine.hooks.runAction({
    entity: entity.name,
    action: action.name,
    id,
    record,
    input,
    ctx: ctx.requestContext(),
    store: ctx.engine.store
  });
  return rereadReply(ctx, entity, action, rowId, outcome);
}

/** Resposta da ação de um registro: o arquivo, ou `{ data, message, open? }` com o registro relido. */
export async function rereadReply(ctx: Ctx, entity: Entity, action: Action, rowId: number, outcome: ActionOutcome): Promise<ActionReply> {
  const known = (e: string) => ctx.engine.entities.has(e);
  if (outcome.file) return buildReply(known, entity, action, outcome);
  // a ação pode ter mudado o registro, tirado do escopo ou apagado
  const r = await fetchOne(await ctx.engine.store.conn(), ctx, entity, rowId);
  if (r) attachCan(ctx, entity, r);
  return buildReply(known, entity, action, outcome, r ?? null);
}
