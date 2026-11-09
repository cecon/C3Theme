// Metadados (`/_meta/...`): o app, o login (público), uma entidade com as capabilities do usuário e o contexto de filiais.

import { COMPANY_COL, type Rec, isObject } from '../domain/types';
import type { EngineRequest } from '../ports/request';
import { intAt, textAt } from '../ports/store';
import { accessMeta } from './access';
import { Ctx, titleName } from './ctx';
import type { Engine } from './engine';
import { sourceDefaults } from './source';

/** `{ data, pages }`: o app.json e, para cada página com `permission`, se o usuário pode abri-la. */
export async function metaApp(engine: Engine, req: EngineRequest): Promise<Rec> {
  const raw = engine.app.raw;
  const guarded = (Array.isArray(raw.pages) ? raw.pages : []).filter(
    (p): p is Rec => isObject(p) && typeof p.path === 'string' && typeof p.permission === 'string'
  );
  const pages: Rec = {};
  if (guarded.length) {
    // filial do cabeçalho que não vale mais não derruba a carga do app: responde sem filial
    const ctx = await Ctx.of(engine, req).catch(() => undefined);
    for (const p of guarded) {
      const code = p.permission as string;
      pages[p.path as string] = ctx ? ctx.permitted(code) : engine.hooks.permitted(code, undefined, req);
    }
  }
  return { data: raw, pages };
}

/** O que a tela de login precisa antes de haver usuário: o nome do sistema e `auth`. Rota pública. */
export function metaLogin(engine: Engine): Rec {
  const raw = engine.app.raw;
  return { name: raw.name ?? null, auth: raw.auth ?? null };
}

/** `{ data, capabilities }`: o JSON da entidade e o que o usuário pode fazer nela. */
export async function metaEntity(engine: Engine, req: EngineRequest, name: string): Promise<Rec> {
  const entity = engine.entity(name);
  const ctx = await Ctx.of(engine, req);
  const caps = { ...ctx.activeCaps(name) };
  const noWrite = engine.children.parentOf(name) !== undefined || entity.source !== undefined;
  if (noWrite) [caps.create, caps.update, caps.delete] = [false, false, false];
  if (entity.singleton) caps.delete = false;
  // ação exige read: quem não vê o registro não age sobre ele
  const active = ctx.active();
  const actions: Rec = {};
  for (const a of entity.actions)
    actions[a.name] = caps.read && engine.hooks.actionAllowed(name, a.name, active ? String(active.id) : undefined, req);
  const out: Rec = { data: entity.raw, capabilities: { ...caps, actions, fields: accessMeta(ctx, entity) } };
  // valores iniciais da faixa de parâmetros, com as datas relativas resolvidas pelo relógio do sistema
  if (entity.source) out.paramDefaults = sourceDefaults(entity.source, engine.hooks.clock(req));
  return out;
}

/** Empresas e filiais que o usuário enxerga, a ativa e a sugerida. */
export async function metaContext(engine: Engine, req: EngineRequest): Promise<Rec> {
  const ctx = await Ctx.of(engine, req);
  const o = engine.app.organization;
  if (!ctx.org || !o) return { organization: null, companies: [], branches: [], activeBranch: null, defaultBranch: null };
  const bt = titleName(engine.entities.get(o.branch));
  const ct = titleName(engine.entities.get(o.company));
  const ids = ctx.org.allowed.map((b) => b.id).join(', ') || 'NULL';
  const sql =
    `SELECT b."id", b."${bt}", c."id", c."${ct}" FROM "${o.branch}" b JOIN "${o.company}" c ON c."id" = b."${COMPANY_COL}" ` +
    `WHERE b."id" IN (${ids}) ORDER BY c."${ct}", c."id", b."${bt}", b."id"`;
  const rows = await (await engine.store.conn()).query(sql);
  const seen = new Set<number>();
  const companies: Rec[] = [];
  const branches: Rec[] = [];
  for (const r of rows) {
    const [bid, btitle, cid, ctitle] = [intAt(r, 0) ?? 0, textAt(r, 1), intAt(r, 2) ?? 0, textAt(r, 3)];
    if (!seen.has(cid)) {
      seen.add(cid);
      companies.push({ id: String(cid), title: ctitle });
    }
    branches.push({ id: String(bid), title: btitle, company: String(cid) });
  }
  return {
    organization: { company: o.company, branch: o.branch },
    companies,
    branches,
    activeBranch: ctx.org.active ? String(ctx.org.active.id) : null,
    defaultBranch: ctx.org.default !== undefined ? String(ctx.org.default) : null
  };
}
