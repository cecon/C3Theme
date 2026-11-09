import { describe, expect, it } from 'vitest';

import type { Message } from './types';
import type { UiPart } from './ui';
import { applyUiCancel, findPendingPart, isUiConflict, keepOnePending, supersededBy, UiConflictError } from './uiPending';
import { openWindow, windowReducer } from './window';

const part = (id: string, extra: Partial<UiPart> = {}): UiPart => ({ id, kind: 'c3.form', payload: {}, ...extra });
const msg = (id: string, minute: number, ui?: UiPart[]): Message => ({
  id,
  conversationId: 'c1',
  author: { id: 'bot', name: 'Assistente' },
  direction: 'in',
  createdAt: new Date(Date.UTC(2026, 10, 4, 12, minute)).toISOString(),
  ui
});
const states = (messages: Message[]) =>
  messages.flatMap((m) => (m.ui ?? []).map((p) => `${p.id}:${p.state ?? 'pending'}${p.reason ? `/${p.reason}` : ''}`));

describe('uma parte pendente por conversa', () => {
  it('a pendente é a mais nova ainda aberta', () => {
    const now = Date.parse('2026-11-04T13:00:00Z');
    const messages = [msg('a', 1, [part('p1', { version: 2 })]), msg('b', 2, [part('p2', { expiresAt: '2026-11-04T12:30:00Z' })])];
    expect(findPendingPart(messages, now)).toEqual({ messageId: 'a', partId: 'p1', kind: 'c3.form', version: 2 });
    expect(findPendingPart([msg('a', 1, [part('p1', { state: 'submitted' })])])).toBeUndefined();
  });

  it('a nova fecha a anterior como substituída, sem mexer nas respondidas', () => {
    const messages = [msg('a', 1, [part('p0', { state: 'submitted' }), part('p1')]), msg('b', 2, [part('p2'), part('p3')])];
    expect(supersededBy(messages)).toEqual([
      { messageId: 'a', partId: 'p1' },
      { messageId: 'b', partId: 'p2' }
    ]);
    const out = keepOnePending(messages);
    expect(states(out)).toEqual(['p0:submitted', 'p1:cancelled/superseded', 'p2:cancelled/superseded', 'p3:pending']);
    expect(keepOnePending(out)).toBe(out);
  });

  it('sem nada a mudar devolve a mesma lista', () => {
    const messages = [msg('a', 1, [part('p1')]), msg('b', 2)];
    expect(keepOnePending(messages)).toBe(messages);
    expect(supersededBy(messages)).toEqual([]);
  });

  it('ui.cancel fecha só a parte pendente com o motivo', () => {
    const messages = [msg('a', 1, [part('p1'), part('p2', { state: 'declined' })])];
    expect(states(applyUiCancel(messages, 'p1', 'agent'))).toEqual(['p1:cancelled/agent', 'p2:declined']);
    expect(states(applyUiCancel(messages, 'p1', 'expired'))).toEqual(['p1:expired/expired', 'p2:declined']);
    expect(applyUiCancel(messages, 'p2', 'agent')).toBe(messages);
  });

  it('conflito vem como UiConflictError ou qualquer erro com status 409', () => {
    expect(isUiConflict(new UiConflictError())).toBe(true);
    expect(isUiConflict(Object.assign(new Error('x'), { status: 409 }))).toBe(true);
    expect(isUiConflict(new Error('rede'))).toBe(false);
    expect(isUiConflict(null)).toBe(false);
  });
});

describe('janela com partes', () => {
  it('mensagem nova com parte fecha a pendente', () => {
    let s = windowReducer(openWindow('c1'), {
      type: 'page',
      conversationId: 'c1',
      page: { messages: [msg('a', 1, [part('p1')])], hasMore: false },
      older: false
    });
    s = windowReducer(s, { type: 'event', event: { type: 'message', message: msg('b', 2, [part('p2')]) } });
    expect(states(s.messages)).toEqual(['p1:cancelled/superseded', 'p2:pending']);
  });

  it('ui.cancel da mensagem certa, e ignora outra conversa', () => {
    const page = { messages: [msg('a', 1, [part('p1', { state: 'submitted' })]), msg('b', 2, [part('p1')])], hasMore: false };
    let s = windowReducer(openWindow('c1'), { type: 'page', conversationId: 'c1', page, older: false });
    const other = windowReducer(s, { type: 'event', event: { type: 'ui.cancel', conversationId: 'c2', partId: 'p1', reason: 'agent' } });
    expect(other).toBe(s);
    s = windowReducer(s, {
      type: 'event',
      event: { type: 'ui.cancel', conversationId: 'c1', messageId: 'b', partId: 'p1', reason: 'agent' }
    });
    expect(states(s.messages)).toEqual(['p1:submitted', 'p1:cancelled/agent']);
  });
});
