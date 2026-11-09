// Consultar e preencher: `POST /{entity}/_lookups/{name}` com `{ value }`. O motor confere a declaração, a permissão e
// o valor de origem; quem consulta a fonte externa é o sistema. O que volta é conferido contra `fills` e o tipo.

import { type Entity, fieldOf } from '../domain/entity';
import { ApiError, FieldErrors } from '../domain/errors';
import { type LookupSpec, declaredLookups } from '../domain/lookup-spec';
import { type Rec, isObject } from '../domain/types';
import { parseId } from '../domain/value';
import type { EngineRequest } from '../ports/request';
import { Ctx, allowRead } from './ctx';
import type { Engine } from './engine';
import { checkValue } from './validation';

export async function runLookup(engine: Engine, req: EngineRequest, name: string, lookupName: string, body: unknown): Promise<Rec> {
  const entity = engine.entity(name);
  const lookup = declaredLookups(entity).find((l) => l.name === lookupName);
  if (!lookup) throw ApiError.notFound(`Consulta '${lookupName}' não existe.`);
  const ctx = await Ctx.of(engine, req);
  // quem consulta está preenchendo o formulário: precisa poder criar ou alterar (filha: vale a permissão do pai)
  const parent = engine.children.parentOf(name);
  allowRead(ctx, parent !== undefined ? engine.entity(parent) : entity, (c) => c.create || c.update);
  if (!isObject(body) || Object.keys(body).length !== 1 || typeof body.value !== 'string')
    throw ApiError.badRequest('Corpo precisa ser { "value": "..." }.');
  const source = fieldOf(entity, lookup.field)!;
  const errors = new FieldErrors();
  if (body.value === '') errors.add(source.name, 'required', 'Campo obrigatório.');
  checkValue(source, body.value, errors);
  if (!errors.isEmpty()) throw ApiError.validation(errors);
  const data = await engine.hooks.lookup({ entity: name, lookup: lookup.name, value: body.value, ctx: ctx.requestContext() });
  checkResult(entity, lookup, data);
  return data;
}

/** O sistema só devolve campos de `fills`, no formato trafegado. Fora disso é erro do sistema: 500. */
function checkResult(entity: Entity, lookup: LookupSpec, data: Rec): void {
  for (const [key, v] of Object.entries(data)) {
    const f = lookup.fills.includes(key) ? fieldOf(entity, key) : undefined;
    let ok: boolean;
    if (!f) ok = false;
    else if (v === null) ok = true;
    else if (f.type === 'reference') ok = isObject(v) && typeof v.id === 'string' && parseId(v.id) !== undefined;
    else {
      const errors = new FieldErrors();
      checkValue(f, v, errors);
      ok = errors.isEmpty();
    }
    if (!ok) {
      console.error(`c3-engine-node: lookup ${entity.name}.${lookup.name} devolveu '${key}' fora de fills ou do formato`);
      throw ApiError.internal();
    }
  }
}
