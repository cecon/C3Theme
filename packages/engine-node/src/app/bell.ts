// Sino: rotas /_notifications e o canal que avisa o usuário que a lista dele mudou. Quem guarda é o sistema
// (`Notifications`); o sistema guarda a instância de `Bell` e chama `notify(usuário)` depois de criar um aviso.

import { ApiError } from '../domain/errors';
import { type Rec, isObject } from '../domain/types';
import type { Notifications } from '../ports/notifications';
import type { EngineRequest } from '../ports/request';
import type { Engine } from './engine';

const MAX = 100;

export class Bell {
  private readonly subs = new Set<(audience: string) => void>();

  /** Avisa as abas abertas de `audience`: a shell relê GET /_notifications. */
  notify(audience: string): void {
    for (const s of this.subs) s(audience);
  }

  listen(fn: (audience: string) => void): () => void {
    this.subs.add(fn);
    return () => this.subs.delete(fn);
  }
}

function port(engine: Engine): Notifications {
  if (!engine.notifications) throw ApiError.notFound('Este sistema não tem notificações.');
  return engine.notifications;
}

/** `limit` da query: ausente vale 20; fora de 1..100 ou não numérico, 400. */
export function parseLimit(raw: string | undefined): number {
  if (raw === undefined) return 20;
  const n = Number(raw);
  if (!/^\d+$/.test(raw) || n < 1 || n > MAX) throw ApiError.badRequest('limit precisa ser um número de 1 a 100.');
  return n;
}

/** Corpo de POST /_notifications/_read: `{}` (todos) ou `{ ids: [...] }`. */
export function parseIds(body: Rec): string[] | undefined {
  const bad = () => ApiError.badRequest('Corpo precisa ser {} ou { "ids": ["..."] } com até 100 ids.');
  if (Object.keys(body).some((k) => k !== 'ids')) throw bad();
  if (!('ids' in body)) return undefined;
  const ids = body.ids;
  if (!Array.isArray(ids) || ids.length > MAX || ids.some((x) => typeof x !== 'string')) throw bad();
  return ids as string[];
}

export async function listNotifications(engine: Engine, req: EngineRequest): Promise<Rec> {
  const p = port(engine);
  const limit = parseLimit(req.query.limit);
  const page = await p.list(p.audience(req), limit);
  return { items: page.items.slice(0, limit).map((n) => ({ ...n, readAt: n.readAt ?? null })), unread: page.unread };
}

export async function readNotifications(engine: Engine, req: EngineRequest, body: Rec): Promise<Rec> {
  const p = port(engine);
  const ids = parseIds(isObject(body) ? body : {});
  const audience = p.audience(req);
  const unread = await p.markRead(audience, ids);
  // as outras abas do mesmo usuário atualizam o contador
  engine.bell.notify(audience);
  return { unread };
}

/**
 * SSE: primeiro `ready`, depois um `notification` (sem conteúdo) a cada aviso para este usuário. Iterador à mão (e
 * não gerador) para o `return()` da conexão fechada acordar a espera e soltar o ouvinte na hora.
 */
export function notificationEvents(engine: Engine, req: EngineRequest): AsyncIterable<string> {
  const audience = port(engine).audience(req);
  return {
    [Symbol.asyncIterator](): AsyncIterator<string> {
      let started = false;
      let pending = 0;
      let closed = false;
      let wake: (() => void) | undefined;
      const stop = engine.bell.listen((who) => {
        if (who !== audience) return;
        pending++;
        wake?.();
      });
      const done = (): IteratorResult<string> => ({ value: undefined, done: true });
      return {
        async next() {
          if (!started) {
            started = true;
            return { value: 'event: ready\ndata: {}\n\n', done: false };
          }
          while (!closed && pending === 0) await new Promise<void>((r) => (wake = r));
          wake = undefined;
          if (closed) return done();
          pending = 0;
          return { value: 'event: notification\ndata: {}\n\n', done: false };
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
