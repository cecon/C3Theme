// Ação da lista (`target: list`): `POST /{entity}/_actions/{action}` com `{ input }`, sem registro (importar, aplicar
// modelo). O motor confere permissão e input; quem executa é o sistema (`Hooks.runListAction`).

import type { Action } from '../domain/action-spec';
import type { Entity } from '../domain/entity';
import { ApiError } from '../domain/errors';
import { type Rec, isObject } from '../domain/types';
import type { EngineRequest } from '../ports/request';
import { checkInput, parseActionInput } from './action-input';
import { type ActionReply, buildReply } from './action-reply';
import { Ctx, type Owner, allowRead, ownerOfNew } from './ctx';
import type { Engine } from './engine';

/** Permissão da ação da lista: `list` na entidade e `actionAllowed` na filial ativa. */
export function allowListAction(ctx: Ctx, entity: Entity, action: Action): Owner {
  allowRead(ctx, entity, (c) => c.list);
  const active = ctx.active();
  if (!ctx.engine.hooks.actionAllowed(entity.name, action.name, active ? String(active.id) : undefined, ctx.req))
    throw ApiError.forbidden();
  // reference no input confere contra a filial ativa, dona do que a ação criar
  return active ? ownerOfNew(entity, active) : {};
}

export async function runListAction(
  engine: Engine,
  entity: Entity,
  action: Action,
  req: EngineRequest,
  body: () => Rec
): Promise<ActionReply> {
  const ctx = await Ctx.of(engine, req);
  const owner = allowListAction(ctx, entity, action);
  const all = body();
  const { cursor, ...rest } = all;
  // só a ação em etapas recebe o cursor da etapa anterior; nas outras, é campo desconhecido
  const raw = parseActionInput(action, listInput(action.steps ? rest : all));
  const input = await checkInput(await engine.store.conn(), ctx, action, owner, raw);
  const outcome = await engine.hooks.runListAction({
    entity: entity.name,
    action: action.name,
    input,
    ctx: ctx.requestContext(),
    store: engine.store,
    ...(action.steps && cursor !== undefined && cursor !== null && { cursor })
  });
  return buildReply((e) => engine.entities.has(e), entity, action, outcome);
}

/** Corpo da ação da lista: `{ input }`, nada mais. */
export function listInput(body: Rec): Rec {
  const unknown = Object.keys(body).find((k) => k !== 'input');
  if (unknown !== undefined) throw ApiError.badRequest(`Campo desconhecido '${unknown}' (ação da lista recebe só input).`);
  const input = body.input;
  if (input === undefined || input === null) return {};
  if (!isObject(input)) throw ApiError.badRequest('input precisa ser um objeto JSON.');
  return input;
}
