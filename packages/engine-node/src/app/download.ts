// Download de arquivo: `GET /{entity}/{id}/_files/{field}`. O motor confere permissão, escopo e o campo (como na
// leitura do registro); os bytes vêm do sistema (`Hooks.readFile`).

import { fieldOf } from '../domain/entity';
import { ApiError } from '../domain/errors';
import { isObject } from '../domain/types';
import type { FileContent } from '../ports/hooks';
import type { EngineRequest } from '../ports/request';
import { Ctx } from './ctx';
import type { Engine } from './engine';
import { read } from './read';

export async function download(engine: Engine, req: EngineRequest, name: string, id: string, field: string): Promise<FileContent> {
  // a leitura já confere entidade, permissão, escopo e tira o campo que o usuário não vê
  const record = await read(engine, req, name, id);
  if (fieldOf(engine.entity(name), field)?.type !== 'file') throw ApiError.notFound(`'${field}' não é um campo de arquivo.`);
  if (!isObject(record[field])) throw ApiError.notFound('Sem arquivo.');
  const ctx = await Ctx.of(engine, req);
  return engine.hooks.readFile({ entity: name, id, field, ctx: ctx.requestContext() });
}

/** `Content-Disposition` com o nome em UTF-8 (RFC 6266): baixa com o nome original, acento incluído. */
export const disposition = (name: string): string => `attachment; filename*=UTF-8''${encodeHeader(name)}`;

/** UTF-8 com %XX em tudo que não é letra, dígito, `.`, `-` ou `_`. */
export function encodeHeader(text: string): string {
  let out = '';
  for (const b of new TextEncoder().encode(text)) {
    const c = String.fromCharCode(b);
    out += /[A-Za-z0-9._-]/.test(c) ? c : `%${b.toString(16).toUpperCase().padStart(2, '0')}`;
  }
  return out;
}
