// Valores iniciais do input de uma ação (`prefill: true`): `GET .../_actions/{action}/_prefill`. O motor confere o
// mesmo que ao rodar e devolve só os campos que o input declara.

import { fieldOf } from '../domain/entity';
import { ApiError } from '../domain/errors';
import type { GridInput } from '../domain/grid-spec';
import { type Rec, isObject } from '../domain/types';
import type { EngineRequest } from '../ports/request';
import { checkActionRecord, findAction } from './action';
import { allowListAction } from './action-list';
import { Ctx, allowRead } from './ctx';
import type { Engine } from './engine';
import { parsePathId } from './read';
import { Expect } from './version';

export async function prefill(engine: Engine, req: EngineRequest, name: string, id: string | undefined, actionName: string): Promise<Rec> {
  const entity = engine.entity(name);
  const action = findAction(entity, actionName);
  if (!action.prefill || action.list !== (id === undefined))
    throw ApiError.notFound(`Ação '${actionName}' não tem valores iniciais nesta rota.`);
  const ctx = await Ctx.of(engine, req);
  let record: Rec | undefined;
  if (id !== undefined) {
    allowRead(ctx, entity, (c) => c.read);
    const conn = await engine.store.conn();
    [record] = await checkActionRecord(conn, ctx, entity, action, parsePathId(id), new Expect());
  } else allowListAction(ctx, entity, action);
  const values = await engine.hooks.actionPrefill({ entity: name, action: actionName, id, record, ctx: ctx.requestContext() });
  const data: Rec = {};
  for (const [k, v] of Object.entries(values)) {
    if (fieldOf(action.input, k)) data[k] = v;
    else {
      const grid = action.grids.find((g) => g.name === k);
      if (grid) data[k] = gridRows(grid, v);
    }
  }
  return { data };
}

/** Linhas da grade só com as colunas que ela declara; o que não é lista vira lista vazia. */
function gridRows(grid: GridInput, value: unknown): Rec[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isObject).map((row) => Object.fromEntries(Object.entries(row).filter(([c]) => fieldOf(grid.row, c))));
}
