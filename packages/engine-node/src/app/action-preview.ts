// Prévia da ação (`preview: true`): antes de confirmar, o usuário vê o que a ação vai fazer, calculado pelo sistema
// (`Hooks.previewAction`). Nada é gravado. O motor confere o mesmo que ao rodar, mas o input pode estar pela metade.

import { fieldOf } from '../domain/entity';
import { ApiError } from '../domain/errors';
import type { Rec } from '../domain/types';
import type { EngineRequest } from '../ports/request';
import { bulkBody, checkActionRecord, findAction } from './action';
import { checkInput, parseActionInput } from './action-input';
import { allowListAction, listInput } from './action-list';
import { gridRows } from './action-prefill';
import { checkAll } from './action-together';
import { Ctx, allowRead } from './ctx';
import type { Engine } from './engine';
import { parsePathId } from './read';
import { Expect } from './version';

export async function preview(
  engine: Engine,
  req: EngineRequest,
  name: string,
  id: string | undefined,
  actionName: string,
  body: () => Rec
): Promise<Rec> {
  const entity = engine.entity(name);
  const action = findAction(entity, actionName);
  // registro: ação de registro; sem id: ação da lista ou seleção de uma ação em conjunto
  const routeOk = id !== undefined ? !action.list : action.list || action.together;
  if (!action.preview || !routeOk) throw ApiError.notFound(`Ação '${actionName}' não tem prévia nesta rota.`);
  const ctx = await Ctx.of(engine, req);
  const conn = await engine.store.conn();
  let record: Rec | undefined;
  let ids: string[] = [];
  let input: Rec;
  if (id !== undefined) {
    allowRead(ctx, entity, (c) => c.read);
    const [rec, owner] = await checkActionRecord(conn, ctx, entity, action, parsePathId(id), new Expect());
    record = rec;
    input = await checkInput(conn, ctx, action, owner, parseActionInput(action, body()), true);
    if (action.together) ids = [id];
  } else if (action.together) {
    allowRead(ctx, entity, (c) => c.read);
    const [list, rawBody] = bulkBody(body());
    const raw = parseActionInput(action, rawBody);
    await checkInput(conn, ctx, action, {}, raw, true);
    ids = list;
    input = (await checkAll(ctx, entity, action, ids, raw, true)).input;
  } else {
    const owner = allowListAction(ctx, entity, action);
    input = await checkInput(conn, ctx, action, owner, parseActionInput(action, listInput(body())), true);
  }
  const p = await engine.hooks.previewAction({ entity: name, action: actionName, id, record, ids, input, ctx: ctx.requestContext() });
  // campos simples do input e grades (as linhas trocam as da tela; só as colunas que a grade declara)
  const fill: Rec = {};
  for (const [k, v] of Object.entries(p.fill ?? {})) {
    const grid = action.grids.find((g) => g.name === k);
    if (fieldOf(action.input, k)) fill[k] = v;
    else if (grid) fill[k] = gridRows(grid, v);
  }
  const table = p.table
    ? {
        columns: p.table.columns,
        rows: p.table.rows.map((r) => Object.fromEntries(Object.entries(r).filter(([k]) => p.table!.columns.some((c) => c.name === k))))
      }
    : null;
  return { message: p.message ?? null, fill, table };
}
