// Consultar e preencher: `POST /{entity}/_lookups/{name}` com `{ value }`. O motor confere a declaração, a permissão e
// o valor de origem; quem consulta a fonte externa é o sistema. O que volta é conferido contra `fills` e o tipo.

import { type Entity, fieldOf, fieldsOnly } from '../domain/entity';
import type { Field } from '../domain/field';
import { ApiError, FieldErrors } from '../domain/errors';
import { type LookupSpec, declaredLookups } from '../domain/lookup-spec';
import { type Rec, isObject } from '../domain/types';
import { parseId } from '../domain/value';
import type { EngineRequest } from '../ports/request';
import { Ctx, allowRead, ownerOfNew } from './ctx';
import type { Engine } from './engine';
import { checkFields, checkValue, normalizeRefs } from './validation';

export async function runLookup(engine: Engine, req: EngineRequest, name: string, lookupName: string, body: unknown): Promise<Rec> {
  const entity = engine.entity(name);
  const lookup = declaredLookups(entity).find((l) => l.name === lookupName);
  if (!lookup) throw ApiError.notFound(`Consulta '${lookupName}' não existe.`);
  const ctx = await Ctx.of(engine, req);
  // quem consulta está preenchendo o formulário: precisa poder criar ou alterar (filha: vale a permissão do pai)
  const parent = engine.children.parentOf(name);
  allowRead(ctx, parent !== undefined ? engine.entity(parent) : entity, (c) => c.create || c.update);
  const { value, with: raw } = parseBody(lookup, body);
  const source = fieldOf(entity, lookup.field)!;
  const errors = new FieldErrors();
  if (value === '') errors.add(source.name, 'required', 'Campo obrigatório.');
  else if (source.type === 'string') checkValue(source, value, errors);
  if (!errors.isEmpty()) throw ApiError.validation(errors);
  const withValues = await checkWith(engine, ctx, entity, lookup, value, raw);
  const data = await engine.hooks.lookup({
    entity: name,
    lookup: lookup.name,
    value,
    with: withValues,
    ctx: ctx.requestContext()
  });
  checkResult(entity, lookup, data);
  return data;
}

/** Corpo: `{ value }` e, com `with` declarado, `{ value, with: { campo: valor } }` (só os campos de `with`). */
function parseBody(lookup: LookupSpec, body: unknown): { value: string; with: Rec } {
  const bad = () => ApiError.badRequest('Corpo precisa ser { "value": "..." } (e "with" com os campos declarados).');
  if (!isObject(body) || typeof body.value !== 'string') throw bad();
  if (Object.keys(body).some((k) => k !== 'value' && k !== 'with')) throw bad();
  const raw = body.with ?? {};
  if (!isObject(raw) || Object.keys(raw).some((k) => !lookup.with.includes(k))) throw bad();
  return { value: body.value, with: raw };
}

/** O campo só com as regras do valor: sem obrigatório (salvo a origem), condições, filtro, acesso ou unique. */
const loose = (f: Field, required: boolean): Field => ({
  ...f,
  required,
  readOnly: false,
  createOnly: false,
  unique: false,
  visibleWhen: undefined,
  requiredWhen: undefined,
  readOnlyWhen: undefined,
  refFilter: undefined,
  access: { view: [], edit: [] }
});

/**
 * Confere a origem `reference` e os campos de `with` como na gravação (tipo, regras, `reference` existente no escopo
 * da filial ativa), sem obrigatório: o formulário ainda está pela metade. Erro vai no campo, 422.
 */
async function checkWith(engine: Engine, ctx: Ctx, entity: Entity, lookup: LookupSpec, value: string, raw: Rec): Promise<Rec> {
  const source = fieldOf(entity, lookup.field)!;
  const names = [...lookup.with, ...(source.type === 'reference' ? [source.name] : [])];
  if (!names.length) return {};
  const record: Rec = { ...raw, ...(source.type === 'reference' && { [source.name]: value }) };
  normalizeRefs(entity, record);
  const probe = fieldsOnly(
    `${entity.name}.lookups.${lookup.name}`,
    names.map((n) => loose(fieldOf(entity, n)!, n === source.name))
  );
  const active = ctx.active();
  const errors = new FieldErrors();
  await checkFields(await engine.store.conn(), ctx, probe, active ? ownerOfNew(entity, active) : {}, record, false, errors);
  if (!errors.isEmpty()) throw ApiError.validation(errors);
  return Object.fromEntries(lookup.with.map((n) => [n, record[n] === undefined || record[n] === '' ? null : record[n]]));
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
