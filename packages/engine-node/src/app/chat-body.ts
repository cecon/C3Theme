// Regras puras do pedido de chat (spec/v0/chat.yaml): conversa, limite e corpos. As mesmas do c3-engine (chat.rs).

import { ApiError } from '../domain/errors';
import { type Rec, isObject } from '../domain/types';
import type { Outgoing } from '../ports/chat';

export const MAX_LIMIT = 100;
export const MAX_TEXT = 20_000;
/** Eventos que o navegador entende (`ChatEvent` do @c3theme/chat). */
export const EVENTS = ['message', 'delta', 'typing', 'removed', 'ui.cancel'];

/** Id da conversa: `^[A-Za-z0-9_-]{1,64}$`. */
export function checkConversation(id: string): void {
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) throw ApiError.badRequest('Conversa inválida: use letras, números, _ ou -, até 64.');
}

/** `limit` da query: ausente vale 30; fora de 1..100 ou não numérico, 400. */
export function parseLimit(raw: string | undefined): number {
  if (raw === undefined) return 30;
  const n = Number(raw);
  if (!/^\d+$/.test(raw) || n < 1 || n > MAX_LIMIT) throw ApiError.badRequest('limit precisa ser um número de 1 a 100.');
  return n;
}

function textOf(body: Rec, key: string, max: number): string | undefined {
  const v = body[key];
  if (v === undefined || v === null) return undefined;
  if (typeof v === 'string' && v.length > 0 && [...v].length <= max) return v;
  throw ApiError.badRequest(`${key} precisa ser texto de 1 a ${max} caracteres.`);
}

/** Corpo de POST messages: `{ clientId, text, replyTo?, pendingPart? }`, sem outras chaves. */
export function parseOutgoing(body: Rec): Outgoing {
  const extra = Object.keys(body).find((k) => !['clientId', 'text', 'replyTo', 'pendingPart'].includes(k));
  if (extra) throw ApiError.badRequest(`'${extra}' não vale no envio.`);
  const required = (v: string | undefined, key: string) => {
    if (v === undefined) throw ApiError.badRequest(`${key} é obrigatório.`);
    return v;
  };
  const p = body.pendingPart;
  if (p !== undefined && p !== null && !(isObject(p) && ['messageId', 'partId', 'kind'].every((k) => typeof p[k] === 'string')))
    throw ApiError.badRequest('pendingPart precisa de messageId, partId e kind.');
  const out: Outgoing = {
    clientId: required(textOf(body, 'clientId', 100), 'clientId'),
    text: required(textOf(body, 'text', MAX_TEXT), 'text')
  };
  const replyTo = textOf(body, 'replyTo', 100);
  if (replyTo !== undefined) out.replyTo = replyTo;
  if (isObject(p)) out.pendingPart = p;
  return out;
}

/** Corpo da resposta de pergunta: `{ optionIds?: string[], text?: string, dismissed?: boolean }`. */
export function parseAnswer(body: Rec): Rec {
  const ok = Object.entries(body).every(([k, v]) => {
    if (k === 'optionIds') return Array.isArray(v) && v.every((x) => typeof x === 'string');
    if (k === 'text') return typeof v === 'string';
    if (k === 'dismissed') return typeof v === 'boolean';
    return false;
  });
  if (!ok) throw ApiError.badRequest('Resposta precisa ser { optionIds?, text?, dismissed? }.');
  return body;
}

/** Corpo da resposta de parte: `action` é `accept`, `decline`, `cancel` ou `undo`; `values` objeto; `version` número. */
export function parseUiAnswer(body: Rec): Rec {
  if (!['accept', 'decline', 'cancel', 'undo'].includes(body.action as string))
    throw ApiError.badRequest('action precisa ser accept, decline, cancel ou undo.');
  const shape = (k: string, ok: (v: unknown) => boolean) => body[k] === undefined || ok(body[k]);
  const whole = (v: unknown) => Number.isInteger(v) && (v as number) >= 0;
  if (!shape('values', isObject) || !shape('version', whole) || !shape('reason', (v) => typeof v === 'string'))
    throw ApiError.badRequest('values precisa ser objeto, version número e reason texto.');
  return body;
}

/** Id de mensagem ou de parte no caminho: não vazio. */
export function checkId(id: string, what: string): void {
  if (id === '') throw ApiError.badRequest(`${what} vazio.`);
}
