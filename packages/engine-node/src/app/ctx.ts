// Contexto de uma requisição: quem pede, de qual filial, e o que pode. O grupo econômico é o banco inteiro; cada
// linha de entidade com escopo carrega `org_company_id` (e `org_branch_id`). O motor aplica isso em todo SQL.

import { ApiError } from '../domain/errors';
import { titleFieldOf } from '../domain/entity';
import type { Entity } from '../domain/entity';
import { BRANCH_COL, COMPANY_COL, type Rec, type Scope, isObject } from '../domain/types';
import type { Capabilities, RequestContext } from '../ports/hooks';
import type { EngineRequest } from '../ports/request';
import { intAt } from '../ports/store';
import type { Engine } from './engine';
import { rowFilter } from './row-access';

export const BRANCH_HEADER = 'c3-branch';

export interface Branch {
  id: number;
  company: number;
}

export interface Org {
  /** Filiais que o usuário enxerga, em ordem de id. */
  allowed: Branch[];
  /** `C3-Branch`, já conferido contra `allowed`. */
  active?: Branch;
  default?: number;
}

/** Empresa e filial donas de um registro. */
export interface Owner {
  company?: number;
  branch?: number;
}

export function ownerOf(record: Rec): Owner {
  const id = (k: string) => {
    const v = record[k];
    const n = isObject(v) && typeof v.id === 'string' ? Number(v.id) : NaN;
    return Number.isInteger(n) ? n : undefined;
  };
  return { company: id('_company'), branch: id('_branch') };
}

export const ownerOfNew = (entity: Entity, active: Branch): Owner => ({
  company: entity.scope !== 'group' ? active.company : undefined,
  branch: entity.scope === 'branch' ? active.id : undefined
});

export class Ctx {
  private readonly caps = new Map<string, Capabilities>();
  private readonly permits = new Map<string, boolean>();

  private constructor(
    readonly engine: Engine,
    readonly req: EngineRequest,
    /** Ausente quando o app não declara `organization`. */
    readonly org?: Org
  ) {}

  static async of(engine: Engine, req: EngineRequest): Promise<Ctx> {
    const o = engine.app.organization;
    return new Ctx(engine, req, o ? await resolve(engine, o.branch, req) : undefined);
  }

  active(): Branch | undefined {
    return this.org?.active;
  }

  allowed(): Branch[] {
    return this.org?.allowed ?? [];
  }

  /** Capabilities do usuário na entidade, numa filial (ou sem filial). Memorizado por requisição. */
  capsOf(entity: string, branch: number | undefined): Capabilities {
    const key = `${entity}\u0000${branch ?? ''}`;
    let c = this.caps.get(key);
    if (!c) {
      c = this.engine.hooks.capabilities(entity, branch === undefined ? undefined : String(branch), this.req);
      this.caps.set(key, c);
    }
    return c;
  }

  /** Capability na filial ativa (ou sem filial): metadados, entidade sem escopo. */
  activeCaps(entity: string): Capabilities {
    return this.capsOf(entity, this.active()?.id);
  }

  allowActive(entity: string, pick: (c: Capabilities) => boolean): void {
    if (!pick(this.activeCaps(entity))) throw ApiError.forbidden();
  }

  /** O usuário tem o código de permissão (na filial ativa)? Memorizado por requisição. */
  permitted(code: string): boolean {
    let p = this.permits.get(code);
    if (p === undefined) {
      const b = this.active();
      p = this.engine.hooks.permitted(code, b ? String(b.id) : undefined, this.req);
      this.permits.set(code, p);
    }
    return p;
  }

  /** Filiais permitidas em que o usuário tem a capability nesta entidade. */
  branchesWith(entity: string, pick: (c: Capabilities) => boolean): Branch[] {
    return this.allowed().filter((b) => pick(this.capsOf(entity, b.id)));
  }

  /** Escopo de leitura como SQL sobre `alias`: filiais com `read` e `rowAccess` (undefined = nenhum filtro). */
  readScope(entity: Entity, alias: string): string | undefined {
    const branches =
      entity.scope !== 'group'
        ? scopeSql(
            entity.scope,
            this.branchesWith(entity.name, (c) => c.read),
            alias
          )
        : undefined;
    const rows = rowFilter(this, entity, alias);
    if (branches !== undefined && rows !== undefined) return `${branches} AND ${rows}`;
    return branches ?? rows;
  }

  /** Pode alterar/excluir um registro existente? Em `branch`, decide a filial dona; em `company`, uma da mesma empresa. */
  canWrite(entity: Entity, owner: Owner, pick: (c: Capabilities) => boolean): boolean {
    switch (entity.scope) {
      case 'group':
        return pick(this.activeCaps(entity.name));
      case 'branch':
        return (
          owner.branch !== undefined && this.allowed().some((a) => a.id === owner.branch) && pick(this.capsOf(entity.name, owner.branch))
        );
      case 'company': {
        const a = this.active();
        const candidates = a ? [a] : this.allowed();
        return candidates.some((b) => b.company === owner.company && pick(this.capsOf(entity.name, b.id)));
      }
    }
  }

  requestContext(): RequestContext {
    const a = this.active();
    return { req: this.req, activeBranch: a ? String(a.id) : undefined, activeCompany: a ? String(a.company) : undefined };
  }
}

/** Ler exige a capability em alguma filial (ou na ativa, sem escopo). */
export function allowRead(ctx: Ctx, entity: Entity, pick: (c: Capabilities) => boolean): void {
  if (entity.scope === 'group') return ctx.allowActive(entity.name, pick);
  if (ctx.branchesWith(entity.name, pick).length === 0) throw ApiError.forbidden();
}

/** `alias.org_branch_id IN (...)` ou `alias.org_company_id IN (...)`. Ids são inteiros já validados: vão literais. */
export function scopeSql(scope: Scope, branches: Branch[], alias: string): string {
  if (scope === 'group') return '1';
  const ids = scope === 'branch' ? branches.map((b) => b.id) : [...new Set(branches.map((b) => b.company))].sort((a, b) => a - b);
  if (ids.length === 0) return '0';
  return `${alias}."${scope === 'branch' ? BRANCH_COL : COMPANY_COL}" IN (${ids.join(', ')})`;
}

async function resolve(engine: Engine, branchEntity: string, req: EngineRequest): Promise<Org> {
  const access = await engine.hooks.orgAccess(req);
  const conn = await engine.store.conn();
  const rows = await conn.query(`SELECT "id", "${COMPANY_COL}" FROM "${branchEntity}" ORDER BY "id"`);
  const wanted = access.branches ? new Set(access.branches.map(Number).filter(Number.isInteger)) : undefined;
  const allowed = rows.map((r) => ({ id: intAt(r, 0) ?? 0, company: intAt(r, 1) ?? 0 })).filter((b) => !wanted || wanted.has(b.id));
  let active: Branch | undefined;
  const header = req.headers[BRANCH_HEADER];
  if (header !== undefined) {
    const t = header.trim();
    if (!/^-?\d+$/.test(t)) throw ApiError.badRequest('Cabeçalho C3-Branch inválido.');
    active = allowed.find((b) => b.id === Number(t));
    if (!active) throw ApiError.forbidden();
  }
  const d = access.defaultBranch !== undefined ? Number(access.defaultBranch) : NaN;
  return { allowed, active, default: allowed.some((b) => b.id === d) ? d : undefined };
}

/** Coluna de título de uma entidade (para os donos e o contexto). */
export const titleName = (e: Entity | undefined): string => (e ? (titleFieldOf(e)?.name ?? '') : '');
