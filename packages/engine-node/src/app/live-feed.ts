// O que cada assinante do tempo real recebe: o contexto é refeito a cada aviso (sessão que caiu ou permissão retirada
// encerram a assinatura) e `created`/`updated` só saem se o registro aparece na leitura dele.

import { ApiError } from '../domain/errors';
import type { Rec } from '../domain/types';
import { parseId } from '../domain/value';
import type { EngineRequest } from '../ports/request';
import { Ctx, allowRead } from './ctx';
import type { Engine } from './engine';
import type { LiveEvent, Subscription } from './live';
import { fetchOne } from './read';

/** Abre a assinatura: a entidade precisa declarar `live` e o usuário precisa poder ler a lista. */
export async function subscribe(engine: Engine, req: EngineRequest, name: string): Promise<Subscription> {
  const entity = engine.entity(name);
  if (!entity.live) throw ApiError.notFound(`Entidade '${name}' não declara live.`);
  allowRead(await Ctx.of(engine, req), entity, (c) => c.list);
  return engine.live.subscribe();
}

/** O aviso para este assinante, ou undefined se não é para ele. Lança quando a assinatura deve fechar. */
export async function forSubscriber(engine: Engine, req: EngineRequest, name: string, ev: LiveEvent): Promise<Rec | undefined> {
  if (ev.entity !== name) return undefined;
  const entity = engine.entity(name);
  const ctx = await Ctx.of(engine, req);
  allowRead(ctx, entity, (c) => c.list);
  if ((ev.change === 'created' || ev.change === 'updated') && !entity.source && ev.id !== undefined) {
    const rowId = parseId(ev.id);
    if (rowId === undefined) return undefined;
    if (!(await fetchOne(await engine.store.conn(), ctx, entity, rowId))) return undefined;
  }
  return { change: ev.change, id: ev.id ?? null };
}

/** Eventos SSE: primeiro `ready`, depois um `change` por aviso; termina quando a assinatura fecha. */
export async function* sseEvents(engine: Engine, req: EngineRequest, name: string, sub: Subscription): AsyncGenerator<string> {
  try {
    yield 'event: ready\ndata: {}\n\n';
    for (;;) {
      const next = await sub.next();
      if (next.done) return;
      const data = await forSubscriber(engine, req, name, next.value).catch(() => null);
      if (data === null) return;
      if (data) yield `event: change\ndata: ${JSON.stringify(data)}\n\n`;
    }
  } finally {
    sub.close();
  }
}
