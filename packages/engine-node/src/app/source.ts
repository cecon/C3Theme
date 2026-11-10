// Consulta do sistema (`source: system`): os parâmetros vêm na URL (`p.<nome>=valor`), são validados como o input de
// uma ação e o `Hooks.source` devolve o SELECT que entra no lugar da tabela: `FROM (sql) t`.

import type { Entity } from '../domain/entity';
import { fieldOf } from '../domain/entity';
import { ApiError, FieldErrors } from '../domain/errors';
import { type Clock, relativeValue } from '../domain/relative-date';
import type { Source } from '../domain/source-spec';
import type { Rec, SqlValue } from '../domain/types';
import { isIntColumn } from '../domain/value';
import { parseInput } from './action-input';
import type { Ctx } from './ctx';
import { rowToJson, selectSql } from './read';
import { checkFields } from './validation';

const PREFIX = 'p.';

/** Consulta do sistema é só leitura pela lista: criar, alterar, excluir e abrir uma linha são 405. */
export function guardRows(entity: Entity): void {
  if (entity.source) throw ApiError.methodNotAllowed('Consulta do sistema: só a lista (com os parâmetros) e as ações de lista.');
}

/** `FROM` de uma leitura: a tabela, ou `(SELECT do sistema)` com os valores dele. */
export async function fromSql(ctx: Ctx, entity: Entity, q: Record<string, string>): Promise<[string, SqlValue[]]> {
  const src = entity.source;
  if (!src) return [`"${entity.name}"`, []];
  return (await sourceSql(ctx, entity, src, q))[0];
}

/**
 * Linhas marcadas de uma consulta do sistema, para a ação em conjunto: a consulta roda com os parâmetros da URL
 * (`p.<nome>`, os mesmos da lista na tela), uma vez, e cada id é procurado nela, no escopo de leitura. Devolve as
 * linhas achadas (por id) e os parâmetros validados, que o sistema recebe junto.
 */
export async function pickedRows(ctx: Ctx, entity: Entity, src: Source, ids: number[]): Promise<[Map<number, Rec>, Rec]> {
  const [[from, values], params] = await sourceSql(ctx, entity, src, ctx.req.query);
  if (!ids.length) return [new Map(), params];
  const scope = ctx.readScope(entity, 't');
  const sql = `${selectSql(ctx, entity, from)} WHERE t."id" IN (${ids.map(() => '?').join(', ')})${scope ? ` AND ${scope}` : ''}`;
  const rows = await (await ctx.engine.store.conn()).query(sql, [...values, ...ids]);
  const found = new Map<number, Rec>();
  for (const row of rows) {
    const rec = rowToJson(entity, row);
    found.set(Number(rec.id), rec);
  }
  return [found, params];
}

/** O SELECT do sistema com os parâmetros validados (400/422), e os parâmetros. */
async function sourceSql(ctx: Ctx, entity: Entity, src: Source, q: Record<string, string>): Promise<[[string, SqlValue[]], Rec]> {
  const engine = ctx.engine;
  const raw = { ...sourceDefaults(src, engine.hooks.clock(ctx.req)), ...fromQuery(src, q) };
  const params = parseInput(src.params, raw);
  const errors = new FieldErrors();
  await checkFields(await engine.store.conn(), ctx, src.params, {}, params, false, errors);
  if (!errors.isEmpty()) throw ApiError.validation(errors);
  const out = await engine.hooks.source({ entity: entity.name, params, ctx: ctx.requestContext() });
  return [[`(${out.sql})`, out.values], params];
}

/** `default` de cada parâmetro no formato trafegado, com as datas relativas já resolvidas. */
export function sourceDefaults(src: Source, clock: Clock): Rec {
  const out: Rec = {};
  for (const f of src.params.fields) if (f.default !== undefined) out[f.name] = f.default;
  for (const [name, rel] of src.relativeDefaults) {
    const datetime = fieldOf(src.params, name)?.type === 'datetime';
    try {
      out[name] = relativeValue(rel, datetime, clock);
    } catch (e) {
      throw ApiError.badRequest(`default de '${name}': ${(e as Error).message}`);
    }
  }
  return out;
}

/** `p.data=2026-11-05` → `{ data: "2026-11-05" }`, no tipo trafegado do campo. Vazio = sem valor. */
function fromQuery(src: Source, q: Record<string, string>): Rec {
  const out: Rec = {};
  for (const [key, raw] of Object.entries(q)) {
    if (!key.startsWith(PREFIX)) continue;
    const name = key.slice(PREFIX.length);
    const f = fieldOf(src.params, name);
    if (!f) throw ApiError.badRequest(`Parâmetro desconhecido '${name}'.`);
    if (raw === '') out[name] = null;
    else if (f.type === 'boolean') out[name] = raw === 'true';
    else if (f.type === 'integer' || f.type === 'flags' || (f.type === 'enum' && isIntColumn(f))) {
      if (!/^[+-]?\d+$/.test(raw) || !Number.isSafeInteger(Number(raw)))
        throw ApiError.badRequest(`Parâmetro '${name}' precisa ser inteiro.`);
      out[name] = Number(raw);
    } else out[name] = raw;
  }
  return out;
}
