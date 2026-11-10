// Filtro comum de lista e agregação: filiais lidas, acesso por linha, `where` e busca livre (`q`).

import { parseCondition } from '../domain/condition';
import { conditionSql, containsPattern } from '../domain/condition-sql';
import type { Entity } from '../domain/entity';
import { ApiError } from '../domain/errors';
import { resolveRelative } from '../domain/relative-date';
import type { Rec, SqlValue } from '../domain/types';
import { type Branch, type Ctx, scopeSql } from './ctx';
import { rowFilter } from './row-access';
import { fromSql } from './source';

/** Filiais lidas por uma lista: `branches=1,2` explícito, ou a ativa, ou todas as permitidas. */
function listBranches(ctx: Ctx, entity: Entity, raw: string | undefined): Branch[] {
  const can = (b: Branch) => ctx.capsOf(entity.name, b.id).list;
  let explicit: number[] | undefined;
  if (raw !== undefined) {
    const parts = raw.split(',').map((p) => p.trim());
    if (!parts.every((p) => /^[+-]?\d+$/.test(p))) throw ApiError.badRequest("'branches' precisa ser ids separados por vírgula.");
    explicit = parts.map(Number);
  } else {
    const a = ctx.active();
    explicit = a ? [a.id] : undefined;
  }
  if (explicit) {
    return explicit.map((id) => {
      const b = ctx.allowed().find((x) => x.id === id);
      if (!b || !can(b)) throw ApiError.forbidden();
      return b;
    });
  }
  const all = ctx.allowed().filter(can);
  if (!all.length) throw ApiError.forbidden();
  return all;
}

/** O `FROM`, o `WHERE` (com o espaço inicial, ou vazio) e os parâmetros dos dois, na ordem dos `?`. */
export interface Filtered {
  from: string;
  where: string;
  params: SqlValue[];
  /** Consulta do sistema: os parâmetros validados, para as colunas da lista (`Hooks.sourceColumns`). */
  sourceParams?: Rec;
}

/** `entity` já passou por `viewOf`: campo oculto não filtra nem é buscado. */
export async function filtered(ctx: Ctx, entity: Entity, q: Record<string, string>): Promise<Filtered> {
  const [from, params, sourceParams] = await fromSql(ctx, entity, q);
  const filters: string[] = [];
  if (entity.scope === 'group') ctx.allowActive(entity.name, (c) => c.list);
  // por fora de qualquer condição do usuário: entra também no COUNT
  else filters.push(scopeSql(entity.scope, listBranches(ctx, entity, q.branches), 't'));
  const rows = rowFilter(ctx, entity, 't');
  if (rows !== undefined) filters.push(rows);
  if (q.where !== undefined) {
    let v: unknown;
    try {
      v = JSON.parse(q.where);
    } catch {
      throw ApiError.badRequest("'where' não é JSON válido.");
    }
    try {
      const resolved = resolveRelative(v, entity, ctx.engine.hooks.clock(ctx.req));
      filters.push(conditionSql(parseCondition(resolved, entity), 't', params));
    } catch (e) {
      if (e instanceof ApiError) throw e;
      throw ApiError.badRequest(`'where' inválido: ${(e as Error).message}.`);
    }
  }
  const text = q.q?.trim();
  if (text) {
    if (!entity.search.length) throw ApiError.badRequest('Esta entidade não tem busca livre (views.list.search).');
    const parts = entity.search.map((f) => {
      params.push(containsPattern(text));
      return `(t."${f}" IS NOT NULL AND t."${f}" REGEXP ?)`;
    });
    filters.push(`(${parts.join(' OR ')})`);
  }
  return { from, where: filters.length ? ` WHERE ${filters.join(' AND ')}` : '', params, sourceParams };
}
