// Chat com o agente (spec/v0/chat.yaml): as rotas e o canal das abas abertas. Quem guarda as conversas e responde é o
// sistema (`Chat`), pela `ChatRoom`. O Node ainda não confere as partes de interface (o c3-engine confere com
// check_agent_part): só transporta.

import { ApiError } from '../domain/errors';
import { type Rec, isObject } from '../domain/types';
import type { Chat, ChatRoom } from '../ports/chat';
import type { EngineRequest } from '../ports/request';
import { EVENTS, checkConversation, checkId, parseAnswer, parseLimit, parseOutgoing, parseUiAnswer } from './chat-body';
import type { Engine } from './engine';

interface Signal {
  audience: string;
  conversation: string;
  event: Rec;
}

/** Canal das conversas: cada aba aberta ouve e filtra a sua. */
export class ChatFeed {
  private readonly subs = new Set<(s: Signal) => void>();

  send(s: Signal): void {
    for (const fn of this.subs) fn(s);
  }

  listen(fn: (s: Signal) => void): () => void {
    this.subs.add(fn);
    return () => this.subs.delete(fn);
  }
}

function room(engine: Engine, audience: string, conversation: string): ChatRoom {
  const emit = (event: Rec) => {
    const type = typeof event.type === 'string' ? event.type : '';
    if (!EVENTS.includes(type)) throw new Error(`evento '${type}' desconhecido`);
    if (type === 'message') {
      if (!isObject(event.message)) throw new Error('message precisa ser um objeto');
      event = { ...event, message: { ...event.message, conversationId: conversation } };
    } else event = { ...event, conversationId: conversation };
    engine.chatFeed.send({ audience, conversation, event });
  };
  return {
    audience,
    conversation,
    inConversation: (id) => {
      checkConversation(id);
      return room(engine, audience, id);
    },
    emit,
    message: (message) => emit({ type: 'message', message }),
    delta: (id, text, done = false) => emit({ type: 'delta', id, text, done })
  };
}

/** A porta e a sala do pedido (404 sem chat, 400 com conversa inválida). */
export function open(engine: Engine, req: EngineRequest, conversation: string): [Chat, ChatRoom] {
  const port = engine.chat;
  if (!port) throw ApiError.notFound('Este sistema não tem assistente.');
  checkConversation(conversation);
  return [port, room(engine, port.audience(req), conversation)];
}

export async function chatHistory(engine: Engine, req: EngineRequest, conversation: string): Promise<Rec> {
  const [port, r] = open(engine, req, conversation);
  const limit = parseLimit(req.query.limit);
  const page = await port.history(r, req.query.before || undefined, limit);
  const skip = Math.max(0, page.messages.length - limit);
  return { messages: page.messages.slice(skip), hasMore: page.hasMore || skip > 0 };
}

export async function chatSend(engine: Engine, req: EngineRequest, conversation: string, body: () => Rec): Promise<Rec> {
  const [port, r] = open(engine, req, conversation);
  return { data: await port.send(r, parseOutgoing(body())) };
}

export async function chatStop(engine: Engine, req: EngineRequest, conversation: string): Promise<void> {
  const [port, r] = open(engine, req, conversation);
  await port.stop?.(r);
}

export async function chatAnswer(engine: Engine, req: EngineRequest, conversation: string, message: string, body: () => Rec) {
  const [port, r] = open(engine, req, conversation);
  checkId(message, 'Mensagem');
  await port.answer(r, message, parseAnswer(body()));
}

export async function chatAnswerUi(
  engine: Engine,
  req: EngineRequest,
  p: { conversation: string; message: string; part: string },
  body: () => Rec
) {
  const [port, r] = open(engine, req, p.conversation);
  checkId(p.message, 'Mensagem');
  checkId(p.part, 'Parte');
  await port.answerUi(r, p.message, p.part, parseUiAnswer(body()));
}

const sse = (name: string, data: unknown) => `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`;

/**
 * SSE: primeiro `ready`, depois cada evento desta conversa deste usuário, com o nome do `type`. Iterador à mão (como o
 * do sino) para o `return()` da conexão fechada soltar o ouvinte na hora.
 */
export function chatEvents(engine: Engine, req: EngineRequest, conversation: string): AsyncIterable<string> {
  const [, r] = open(engine, req, conversation);
  return {
    [Symbol.asyncIterator](): AsyncIterator<string> {
      const queue: string[] = [sse('ready', {})];
      let closed = false;
      let wake: (() => void) | undefined;
      const stop = engine.chatFeed.listen((s) => {
        if (s.audience !== r.audience || s.conversation !== r.conversation) return;
        queue.push(sse(String(s.event.type), s.event));
        wake?.();
      });
      const done = (): IteratorResult<string> => ({ value: undefined, done: true });
      return {
        async next() {
          while (!closed && queue.length === 0) await new Promise<void>((res) => (wake = res));
          wake = undefined;
          if (closed) return done();
          return { value: queue.shift()!, done: false };
        },
        async return() {
          closed = true;
          stop();
          wake?.();
          return done();
        }
      };
    }
  };
}
