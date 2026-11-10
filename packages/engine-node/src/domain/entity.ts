// Documentos da spec v0 (app.json e entidades) carregados em memória. O JSON original é guardado como veio para
// ser servido em `/_meta`; os campos tipados aqui são só o que o motor precisa para validar, gravar e consultar.

import { type Action, checkInverses, parseAction } from './action-spec';
import { parseCondition } from './condition';
import { type Field, type FieldConditions, ID_FIELD, parseFields } from './field';
import { MAX_FILE_SIZE, UPLOAD_CEILING } from './file';
import { type Source, parseSource } from './source-spec';
import { type Rec, type Scope, isIdent, isObject, isTextual } from './types';

export interface Entity {
  name: string;
  scope: Scope;
  fields: Field[];
  titleField?: string;
  search: string[];
  actions: Action[];
  /** `undoable: false` (documento fiscal): nenhum Desfazer, nem de gravação nem de ação. */
  undoable: boolean;
  /** Configuração de registro único por escopo: criar o segundo é 409, excluir é 405. */
  singleton: boolean;
  /** Tempo real: gravações e ações avisam quem está com a tela aberta (`GET /{entity}/_events`). */
  live: boolean;
  /** Consulta do sistema (`source: system`): sem tabela, só leitura, com parâmetros. */
  source?: Source;
  /** JSON exatamente como veio, servido em `/_meta/entities/{name}`. */
  raw: Rec;
}

export interface App {
  entities: string[];
  organization?: { company: string; branch: string };
  /** Teto do `maxSize` dos campos `file` (`maxUploadSize`, em bytes). Sem ele, 1 MB. */
  maxUpload: number;
  raw: Rec;
}

/** Entidade sem tabela, só com campos: o input de uma ação, os parâmetros de uma consulta. */
export function fieldsOnly(name: string, fields: Field[]): Entity {
  return { name, scope: 'group', fields, search: [], actions: [], undoable: false, singleton: false, live: false, raw: {} };
}

export const fieldOf = (e: Entity, name: string): Field | undefined => e.fields.find((f) => f.name === name);

/** Campo que pode ser lido, filtrado e ordenado: todos menos os só de escrita. */
export const readableField = (e: Entity, name: string): Field | undefined => {
  const f = fieldOf(e, name);
  return f && !f.writeOnly ? f : undefined;
};

/** Campo que uma condição pode citar: os legíveis e o `id` implícito. */
export const conditionField = (e: Entity, name: string): Field | undefined => (name === 'id' ? ID_FIELD : readableField(e, name));

export const actionOf = (e: Entity, name: string): Action | undefined => e.actions.find((a) => a.name === name);

/** Campo mostrado quando outra entidade aponta para esta: `titleField` ou o primeiro campo de texto. */
export const titleFieldOf = (e: Entity): Field | undefined =>
  e.titleField !== undefined ? fieldOf(e, e.titleField) : e.fields.find((f) => isTextual(f.type));

function parseJson(text: string, what: string): Rec {
  let v: unknown;
  try {
    v = JSON.parse(text);
  } catch (e) {
    throw new Error(`${what} inválido: ${(e as Error).message}`, { cause: e });
  }
  if (!isObject(v)) throw new Error(`${what} inválido: precisa ser um objeto`);
  return v;
}

export function parseApp(json: string | Rec): App {
  const raw = typeof json === 'string' ? parseJson(json, 'app.json') : json;
  if (!Array.isArray(raw.entities) || !raw.entities.every((e) => typeof e === 'string'))
    throw new Error('app.json inválido: entities precisa ser uma lista de nomes');
  const o = raw.organization;
  let organization: App['organization'];
  if (o !== undefined && o !== null) {
    if (!isObject(o) || typeof o.company !== 'string' || typeof o.branch !== 'string')
      throw new Error('app.json inválido: organization precisa de company e branch');
    organization = { company: o.company, branch: o.branch };
  }
  const maxUpload = raw.maxUploadSize ?? MAX_FILE_SIZE;
  if (typeof maxUpload !== 'number' || !Number.isInteger(maxUpload) || maxUpload < MAX_FILE_SIZE || maxUpload > UPLOAD_CEILING)
    throw new Error(`app.json: maxUploadSize entre ${MAX_FILE_SIZE} e ${UPLOAD_CEILING} bytes (1 MB a 32 MB)`);
  return { entities: raw.entities as string[], organization, maxUpload, raw };
}

/** Condições ainda em JSON: as dos campos e o visibleWhen de cada ação (na ordem de `actions`). */
export interface Pending {
  fields: FieldConditions;
  actions: unknown[];
}

const SCOPES: readonly Scope[] = ['group', 'company', 'branch'];

/** Primeira passada: estrutura e tipos. Condições são resolvidas depois, porque precisam de todos os campos. */
export function parseEntity(json: string | Rec): [Entity, Pending] {
  const raw = typeof json === 'string' ? parseJson(json, 'entidade') : json;
  const name = typeof raw.name === 'string' ? raw.name : '';
  if (!isIdent(name)) throw new Error(`nome de entidade inválido '${name}'`);
  const scope = (raw.scope ?? 'group') as Scope;
  if (!SCOPES.includes(scope)) throw new Error(`${name}: scope desconhecido '${String(raw.scope)}'`);
  if (!Array.isArray(raw.fields)) throw new Error(`entidade inválida: ${name} sem fields`);
  const [fields, conditions] = parseFields(name, raw.fields, isIdent);
  const actions: Action[] = [];
  const actionConditions: unknown[] = [];
  for (const a of Array.isArray(raw.actions) ? raw.actions : []) {
    if (!isObject(a)) throw new Error(`${name}: ação precisa ser um objeto`);
    const aName = typeof a.name === 'string' ? a.name : '';
    if (!isIdent(aName)) throw new Error(`${name}: nome de ação inválido '${aName}'`);
    if (actions.some((x) => x.name === aName)) throw new Error(`${name}: ação '${aName}' repetida`);
    const [action, visibleWhen] = parseAction(name, a, fields, isIdent);
    actions.push(action);
    actionConditions.push(visibleWhen);
  }
  const undoable = raw.undoable !== false;
  checkInverses(name, undoable, actions);
  const views = isObject(raw.views) ? raw.views : {};
  const list = isObject(views.list) ? views.list : {};
  const search = Array.isArray(list.search) ? (list.search as string[]) : [];
  const live = raw.live !== undefined && raw.live !== null && raw.live !== false;
  const entity: Entity = {
    name,
    scope,
    fields,
    titleField: typeof raw.titleField === 'string' ? raw.titleField : undefined,
    search,
    actions,
    undoable,
    singleton: raw.singleton === true,
    live,
    source: parseSource(name, raw.source, raw.params, isIdent),
    raw
  };
  return [entity, { fields: conditions, actions: actionConditions }];
}

/** Resolve as condições dos campos e o visibleWhen das ações (que cita campos do registro). */
export function resolveEntity(entity: Entity, pending: Pending): void {
  resolveConditions(entity, pending.fields);
  pending.actions.forEach((v, i) => {
    if (v === undefined || v === null) return;
    const label = `${entity.name}.actions.${entity.actions[i].name}.visibleWhen`;
    entity.actions[i].visibleWhen = wrap(label, () => parseCondition(v, entity));
  });
}

export function resolveConditions(entity: Entity, conditions: FieldConditions): void {
  for (const [i, visible, required, locked] of conditions) {
    const f = entity.fields[i];
    const label = `${entity.name}.${f.name}`;
    if (visible !== undefined) f.visibleWhen = wrap(`${label}.visibleWhen`, () => parseCondition(visible, entity));
    if (required !== undefined) f.requiredWhen = wrap(`${label}.requiredWhen`, () => parseCondition(required, entity));
    if (locked !== undefined) f.readOnlyWhen = wrap(`${label}.readOnlyWhen`, () => parseCondition(locked, entity));
  }
}

function wrap<T>(label: string, fn: () => T): T {
  try {
    return fn();
  } catch (e) {
    throw new Error(`${label}: ${(e as Error).message}`, { cause: e });
  }
}
