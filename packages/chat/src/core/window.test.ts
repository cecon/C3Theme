import { describe, expect, it } from 'vitest';

import type { Message } from './types';
import { isGenerating, mergeMessages, oldestId, openWindow, windowReducer } from './window';

const msg = (id: string, minute: number, extra: Partial<Message> = {}): Message => ({
  id,
  conversationId: 'c1',
  author: { id: 'ana', name: 'Ana' },
  direction: 'in',
  text: id,
  createdAt: new Date(Date.UTC(2026, 9, 30, 12, minute)).toISOString(),
  ...extra
});

describe('mergeMessages', () => {
  it('ordena por data e não repete id', () => {
    const out = mergeMessages([msg('b', 2)], [msg('a', 1), msg('b', 2, { text: 'editada' })]);
    expect(out.map((m) => m.id)).toEqual(['a', 'b']);
    expect(out[1].text).toBe('editada');
  });

  it('a resposta do servidor substitui a otimista pelo clientId', () => {
    const optimistic = msg('tmp', 3, { clientId: 'tmp', status: 'sending', direction: 'out' });
    const saved = msg('m9', 3, { clientId: 'tmp', status: 'sent', direction: 'out' });
    expect(mergeMessages([msg('a', 1), optimistic], [saved])).toEqual([msg('a', 1), saved]);
  });
});

describe('windowReducer', () => {
  const page = (messages: Message[], hasMore: boolean) => ({ messages, hasMore });

  it('primeira página define hasMore; recarregar as recentes não apaga o histórico acima', () => {
    let s = windowReducer(openWindow('c1'), { type: 'page', conversationId: 'c1', page: page([msg('b', 2)], true), older: false });
    expect(s).toMatchObject({ hasMore: true, loading: null });
    s = windowReducer(s, { type: 'page', conversationId: 'c1', page: page([msg('c', 3)], false), older: false });
    expect(s.hasMore).toBe(true);
    s = windowReducer(s, { type: 'loading', what: 'older' });
    s = windowReducer(s, { type: 'page', conversationId: 'c1', page: page([msg('a', 1)], false), older: true });
    expect(s.messages.map((m) => m.id)).toEqual(['a', 'b', 'c']);
    expect(s.hasMore).toBe(false);
    expect(oldestId(s)).toBe('a');
  });

  it('ignora página e eventos de outra conversa (resposta atrasada)', () => {
    const s = openWindow('c1');
    expect(windowReducer(s, { type: 'page', conversationId: 'c2', page: page([msg('x', 1)], true), older: false })).toBe(s);
    expect(windowReducer(s, { type: 'event', event: { type: 'message', message: msg('x', 1, { conversationId: 'c2' }) } })).toBe(s);
  });

  it('evento entra, remoção tira, e falha marca só a mensagem enviando', () => {
    let s = windowReducer(openWindow('c1'), { type: 'event', event: { type: 'message', message: msg('a', 1) } });
    s = windowReducer(s, { type: 'optimistic', message: msg('t1', 2, { clientId: 't1', status: 'sending' }) });
    s = windowReducer(s, { type: 'failed', clientId: 't1' });
    expect(s.messages[1].status).toBe('failed');
    s = windowReducer(s, { type: 'event', event: { type: 'removed', conversationId: 'c1', id: 'a' } });
    expect(s.messages.map((m) => m.id)).toEqual(['t1']);
  });

  it('abrir a mesma conversa mantém o estado; outra zera', () => {
    const s = windowReducer(openWindow('c1'), { type: 'event', event: { type: 'message', message: msg('a', 1) } });
    expect(windowReducer(s, { type: 'open', conversationId: 'c1' })).toBe(s);
    expect(windowReducer(s, { type: 'open', conversationId: 'c2' }).messages).toEqual([]);
  });
});

describe('resposta em streaming (assistente)', () => {
  it('delta soma ao texto e done encerra', () => {
    let s = windowReducer(openWindow('c1'), {
      type: 'event',
      event: { type: 'message', message: msg('r1', 1, { text: '', streaming: true }) }
    });
    expect(isGenerating(s.messages)).toBe(true);
    s = windowReducer(s, { type: 'event', event: { type: 'delta', conversationId: 'c1', id: 'r1', text: 'Olá, ' } });
    s = windowReducer(s, { type: 'event', event: { type: 'delta', conversationId: 'c1', id: 'r1', text: 'tudo bem?', done: true } });
    expect(s.messages[0]).toMatchObject({ text: 'Olá, tudo bem?', streaming: false });
    expect(isGenerating(s.messages)).toBe(false);
  });

  it('delta de raciocínio soma ao reasoning, não à resposta', () => {
    let s = windowReducer(openWindow('c1'), {
      type: 'event',
      event: { type: 'message', message: msg('r1', 1, { text: '', streaming: true }) }
    });
    s = windowReducer(s, {
      type: 'event',
      event: { type: 'delta', conversationId: 'c1', id: 'r1', text: 'Vou ver ', channel: 'reasoning' }
    });
    s = windowReducer(s, {
      type: 'event',
      event: { type: 'delta', conversationId: 'c1', id: 'r1', text: 'o estoque.', channel: 'reasoning' }
    });
    expect(s.messages[0]).toMatchObject({ text: '', reasoning: 'Vou ver o estoque.', streaming: true });
  });

  it('delta de outra conversa é ignorado', () => {
    const s = windowReducer(openWindow('c1'), { type: 'event', event: { type: 'message', message: msg('r1', 1, { text: 'a' }) } });
    expect(windowReducer(s, { type: 'event', event: { type: 'delta', conversationId: 'c2', id: 'r1', text: 'x' } })).toBe(s);
  });

  it('aviso passageiro: guarda o mais recente com seq novo, tom padrão info; de outra conversa é ignorado', () => {
    const notice = (text: string, more = {}) => ({
      type: 'event' as const,
      event: { type: 'notice' as const, conversationId: 'c1', text, ...more }
    });
    let s = windowReducer(openWindow('c1'), notice('O agente vai parar.'));
    expect(s.notice).toEqual({ seq: 1, text: 'O agente vai parar.', tone: 'info' });
    s = windowReducer(s, notice('O agente vai parar.', { tone: 'warning' }));
    expect(s.notice).toEqual({ seq: 2, text: 'O agente vai parar.', tone: 'warning' });
    expect(windowReducer(s, { type: 'event', event: { type: 'notice', conversationId: 'c2', text: 'x' } })).toBe(s);
    expect(windowReducer(s, { type: 'dismissNotice' }).notice).toBeNull();
    expect(openWindow('c1').notice).toBeNull();
  });
});
