import { ApiError } from '../domain/errors';
import type { Rec } from '../domain/types';
import type { EngineRequest } from '../ports/request';
import { open } from './chat';
import { checkId, MAX_TEXT } from './chat-body';
import type { Engine } from './engine';

/** Shape do contrato; autorização e histórico pertencem ao agente, sempre com a sala do usuário do pedido. */
export function laneInput(body: Rec): { kind: 'aside' | 'branch'; fromMessageId?: string; text?: string } {
  if (Object.keys(body).some((k) => !['kind', 'fromMessageId', 'text'].includes(k)))
    throw ApiError.badRequest('Campo de conversa desconhecido.');
  if (body.kind !== 'aside' && body.kind !== 'branch') throw ApiError.badRequest('kind precisa ser aside ou branch.');
  const id = body.fromMessageId;
  if (id !== undefined && (typeof id !== 'string' || !id)) throw ApiError.badRequest('fromMessageId precisa ser texto não vazio.');
  if (body.kind === 'branch' && !id) throw ApiError.badRequest('Ramo precisa de fromMessageId.');
  const text = body.text;
  if (text !== undefined && (typeof text !== 'string' || [...text].length > MAX_TEXT))
    throw ApiError.badRequest('Texto de conversa inválido.');
  return { kind: body.kind, fromMessageId: id as string | undefined, text: text as string | undefined };
}

export async function chatLanes(engine: Engine, req: EngineRequest, conversation: string): Promise<Rec> {
  const [port, room] = open(engine, req, conversation);
  if (!port.lanes) throw ApiError.notFound('Este sistema não tem conversas à parte.');
  return { data: await port.lanes(room) };
}

export async function chatOpenLane(engine: Engine, req: EngineRequest, conversation: string, body: () => Rec): Promise<Rec> {
  const [port, room] = open(engine, req, conversation);
  if (!port.openLane) throw ApiError.notFound('Este sistema não tem conversas à parte.');
  return { data: await port.openLane(room, laneInput(body())) };
}

export async function chatMessageAction(
  engine: Engine,
  req: EngineRequest,
  conversation: string,
  message: string,
  action: string
): Promise<Rec> {
  const [port, room] = open(engine, req, conversation);
  checkId(message, 'Mensagem');
  checkId(action, 'Ação');
  if (!port.messageAction) throw ApiError.notFound('Este sistema não tem ações por mensagem.');
  return port.messageAction(room, message, action);
}
