// GET /_search: confere `q` e `limit` e chama a porta do sistema. O motor só garante o formato da resposta.

import { ApiError } from '../domain/errors';
import type { Rec } from '../domain/types';
import type { EngineRequest } from '../ports/request';
import type { Engine } from './engine';

const MAX = 50;

/** `q` sem espaços nas pontas, de 2 a 200 caracteres; senão 400. */
export function parseQuery(raw: string | undefined): string {
  const q = (raw ?? '').trim();
  if (q.length < 2 || q.length > 200) throw ApiError.badRequest('q precisa ter de 2 a 200 caracteres.');
  return q;
}

/** `limit`: ausente vale 20; fora de 1..50 ou não numérico, 400. */
export function parseSearchLimit(raw: string | undefined): number {
  if (raw === undefined) return 20;
  const n = Number(raw);
  if (!/^\d+$/.test(raw) || n < 1 || n > MAX) throw ApiError.badRequest('limit precisa ser um número de 1 a 50.');
  return n;
}

export async function search(engine: Engine, req: EngineRequest): Promise<Rec> {
  if (!engine.search) throw ApiError.notFound('Este sistema não tem busca de registros.');
  const q = parseQuery(req.query.q);
  const limit = parseSearchLimit(req.query.limit);
  const hits = await engine.search.search(req, q, limit);
  return {
    data: hits.slice(0, limit).map((h) => ({
      kind: h.kind,
      group: h.group,
      title: h.title,
      snippet: h.snippet ?? null,
      path: h.path,
      icon: h.icon ?? null,
      at: h.at ?? null
    }))
  };
}
