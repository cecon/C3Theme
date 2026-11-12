// Estados declarados do chat (#101): o que cobre o painel, a faixa e o lugar da conversa vazia; e a escuta das rotas.
import { describe, expect, it, vi } from 'vitest';

import type { ChatTransport } from '@c3theme/chat';

import { ApiError } from '../apiError';
import type { PageStates } from '../pageStates/types';
import { chatStates, failureOf, watchFailures, type ChatStateInput } from './chatStates';

const all: PageStates = {
  loading: { message: 'Abrindo a conversa' },
  empty: { message: 'Nenhuma conversa ainda', action: { label: 'Agentes', path: '/agentes' } },
  error: { message: 'Não deu para abrir', action: { label: 'De novo', retry: true } },
  forbidden: { message: 'Sem permissão', instruction: 'Peça acesso' },
  offline: { message: 'Sem rede', works: ['O histórico'] }
};
const base: ChatStateInput = { loading: false, failure: null, online: true, count: 0 };
const at = (s: Partial<ChatStateInput>, states: PageStates | null = all) => chatStates(states ?? undefined, { ...base, ...s });
const none = { cover: null, banner: null, slot: null };

describe('failureOf', () => {
  it('403 é sem permissão, status 0 é offline e o resto é erro', () => {
    expect(failureOf(new ApiError(403, 'forbidden', 'x'))).toBe('forbidden');
    expect(failureOf(new ApiError(0, 'network', 'x'))).toBe('offline');
    expect(failureOf(new ApiError(500, 'internal', 'x'))).toBe('error');
    expect(failureOf(new ApiError(404, 'not_found', 'x'))).toBe('error');
    expect(failureOf(new Error('x'))).toBe('error');
  });
});

describe('chatStates', () => {
  it('sem states, nada muda', () => {
    expect(at({ failure: 'forbidden' }, null)).toEqual(none);
    expect(at({ online: false }, null)).toEqual(none);
  });

  it('403 cobre o painel, com ou sem histórico', () => {
    expect(at({ failure: 'forbidden' })).toEqual({ ...none, cover: 'forbidden' });
    expect(at({ failure: 'forbidden', count: 3 })).toEqual({ ...none, cover: 'forbidden' });
  });

  it('offline e erro vão na faixa com histórico e no lugar da conversa sem ele', () => {
    expect(at({ failure: 'offline', count: 2 })).toEqual({ ...none, banner: 'offline' });
    expect(at({ online: false, count: 2 })).toEqual({ ...none, banner: 'offline' });
    expect(at({ online: false })).toEqual({ ...none, slot: 'offline' });
    expect(at({ failure: 'error', count: 2 })).toEqual({ ...none, banner: 'error' });
    expect(at({ failure: 'error' })).toEqual({ ...none, slot: 'error' });
  });

  it('sem rede ganha de erro do servidor', () => {
    expect(at({ online: false, failure: 'error' })).toEqual({ ...none, slot: 'offline' });
  });

  it('abrindo mostra carregando; aberta e vazia mostra o vazio; com mensagens, nada', () => {
    expect(at({ loading: true })).toEqual({ ...none, slot: 'loading' });
    expect(at({})).toEqual({ ...none, slot: 'empty' });
    expect(at({ count: 1 })).toEqual(none);
  });
});

describe('watchFailures', () => {
  function transport(over: Partial<ChatTransport>): ChatTransport {
    return {
      loadMessages: async () => ({ messages: [], hasMore: false }),
      send: async () => ({}) as never,
      subscribe: () => () => {},
      ...over
    } as ChatTransport;
  }

  it('abrir e enviar contam a falha classificada e o acerto como null', async () => {
    const seen = vi.fn();
    const ok = watchFailures(transport({}), seen);
    await ok.loadMessages('a', { limit: 1 });
    expect(seen).toHaveBeenLastCalledWith(null);
    const denied = watchFailures(transport({ send: () => Promise.reject(new ApiError(403, 'forbidden', 'x')) }), seen);
    await expect(denied.send({} as never)).rejects.toBeInstanceOf(ApiError);
    expect(seen).toHaveBeenLastCalledWith('forbidden');
    const down = watchFailures(transport({ loadMessages: () => Promise.reject(new ApiError(0, 'network', 'x')) }), seen);
    await expect(down.loadMessages('a', { limit: 1 })).rejects.toBeInstanceOf(ApiError);
    expect(seen).toHaveBeenLastCalledWith('offline');
  });

  it('abrir abortado (painel fechado) não conta como falha', async () => {
    const seen = vi.fn();
    const abort = Object.assign(new Error('x'), { name: 'AbortError' });
    const t = watchFailures(transport({ loadMessages: () => Promise.reject(abort) }), seen);
    await expect(t.loadMessages('a', { limit: 1 })).rejects.toBe(abort);
    expect(seen).not.toHaveBeenCalled();
    const odd = watchFailures(transport({ loadMessages: () => Promise.reject(null) }), seen);
    await expect(odd.loadMessages('a', { limit: 1 })).rejects.toBeNull();
    expect(seen).toHaveBeenLastCalledWith('error');
  });
});
