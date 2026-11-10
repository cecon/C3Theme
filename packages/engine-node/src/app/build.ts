// Montagem do motor: lê os JSONs da spec, confere as regras que o JSON Schema não expressa e o banco. Falha alto no
// boot, para o erro aparecer no deploy e não na tela.

import { parseChildren } from '../domain/children-spec';
import { type App, type Entity, fieldOf, parseApp, parseEntity, resolveEntity, titleFieldOf } from '../domain/entity';
import { checkLookups } from '../domain/lookup-spec';
import { checkRefFilter } from '../domain/ref-filter';
import { checkStores } from '../domain/store-spec';
import { parseRowRules } from '../domain/row-access';
import { applySections } from '../domain/section';
import { type Rec, isTextual } from '../domain/types';
import type { Hooks } from '../ports/hooks';
import type { Notifications } from '../ports/notifications';
import type { Search } from '../ports/search';
import type { Store } from '../ports/store';
import { checkDatabase, checkHooks } from './boot';
import { Engine } from './engine';
import { Bell } from './bell';
import { Live } from './live';
import { System } from './system';

export interface EngineOptions {
  store: Store;
  /** app.json (texto ou objeto). */
  app: string | Rec;
  /** Os JSONs das entidades. */
  entities: (string | Rec)[];
  hooks?: Hooks;
  /** Canal de tempo real criado antes, para os hooks avisarem o que o sistema grava. */
  live?: Live;
  /** Sino do header: onde o sistema guarda os avisos de cada usuário (sem ela, /_notifications é 404). */
  notifications?: Notifications;
  /** Canal do sino criado antes, para o sistema avisar quando cria um aviso (`bell.notify(usuário)`). */
  bell?: Bell;
  /** Busca do Ctrl K (`header.search: { records: true }`): o que o sistema acha para o texto (sem ela, /_search é 404). */
  search?: Search;
  /** Bancos a mais, por nome, das entidades com `store` (só leitura). */
  stores?: Record<string, Store>;
  /** O motor só lê: toda gravação é do sistema (conexão com `PRAGMA query_only`). */
  readOnly?: boolean;
}

export class BuildError extends Error {
  constructor(message: string) {
    super(`c3-engine-node: ${message}`);
  }
}

export async function buildEngine(o: EngineOptions): Promise<Engine> {
  try {
    const app = parseApp(o.app);
    const entities = loadEntities(app, o.entities);
    checkOrganization(app, entities);
    checkReferences(entities, app.maxUpload);
    const children = parseChildren(entities);
    checkLookups(entities);
    const rowAccess = new Map([...entities.values()].map((e) => [e.name, parseRowRules(e)]));
    const hooks = new System(o.hooks ?? {});
    checkHooks(entities, children, hooks, o.readOnly === true);
    const stores = new Map(Object.entries(o.stores ?? {}));
    checkStores(entities, new Set(stores.keys()));
    await checkDatabase(o.store, entities, o.readOnly === true);
    for (const [name, store] of stores) await checkDatabase(store, entities, true, name);
    return new Engine(
      app,
      entities,
      children,
      rowAccess,
      o.store,
      hooks,
      o.live ?? new Live(),
      o.bell ?? new Bell(),
      o.notifications,
      o.search,
      stores
    );
  } catch (e) {
    if (e instanceof BuildError) throw e;
    throw new BuildError((e as Error).message);
  }
}

function loadEntities(app: App, raw: (string | Rec)[]): Map<string, Entity> {
  const parsed = raw.map((j) => parseEntity(j));
  const entities = new Map<string, Entity>();
  for (const [entity, pending] of parsed) {
    resolveEntity(entity, pending);
    applySections(entity);
    if (!app.entities.includes(entity.name)) throw new Error(`entidade '${entity.name}' carregada mas fora de app.entities`);
    entities.set(entity.name, entity);
  }
  for (const name of app.entities)
    if (!entities.has(name)) throw new Error(`app.entities cita '${name}', mas a entidade não foi carregada`);
  return entities;
}

function checkOrganization(app: App, entities: Map<string, Entity>): void {
  const o = app.organization;
  if (!o) {
    const e = [...entities.values()].find((x) => x.scope !== 'group');
    if (e) throw new Error(`${e.name} tem scope, mas o app.json não declara organization`);
    return;
  }
  for (const [role, name, scope] of [
    ['company', o.company, 'group'],
    ['branch', o.branch, 'company']
  ] as const) {
    const e = entities.get(name);
    if (!e) throw new Error(`organization.${role} cita '${name}', que não está em app.entities`);
    if (e.scope !== scope) throw new Error(`${name} (organization.${role}) precisa de scope '${scope}'`);
  }
}

function checkReferences(entities: Map<string, Entity>, maxUpload: number): void {
  for (const entity of entities.values()) {
    // cada campo com o "dono" das variáveis do filtro: a entidade, o input da ação ou a linha da grade
    const own = (e: Entity) => e.fields.map((f) => [e, f] as const);
    const all = [...own(entity), ...entity.actions.flatMap((a) => [...own(a.input), ...a.grids.flatMap((g) => own(g.row))])];
    for (const [source, f] of all) {
      if (f.type === 'file' && f.maxSize > maxUpload)
        throw new Error(`${entity.name}.${f.name}: maxSize ${f.maxSize} acima do maxUploadSize do app (${maxUpload} bytes)`);
      if (f.reference === undefined) continue;
      const target = entities.get(f.reference);
      if (!target) throw new Error(`${entity.name}.${f.name} referencia entidade desconhecida`);
      checkRefFilter(source, f, target);
      const title = titleFieldOf(target);
      if (!title || !isTextual(title.type)) throw new Error(`${target.name} precisa de um titleField de texto para ser referenciada`);
    }
    for (const s of entity.search) {
      const f = fieldOf(entity, s);
      if (!f || !isTextual(f.type) || f.writeOnly) throw new Error(`${entity.name}.views.list.search: '${s}' precisa ser campo de texto`);
    }
  }
}
