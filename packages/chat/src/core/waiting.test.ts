import { describe, expect, it } from 'vitest';

import type { Message } from './types';
import { shouldAnnounce, waitingFor } from './waiting';

const msg = (id: string, extra: Partial<Message> = {}): Message => ({
  id,
  conversationId: 'c',
  author: { id: 'bot', name: 'Bot' },
  direction: 'in',
  createdAt: '2026-11-12T10:00:00Z',
  ...extra
});
const question = { id: 'q', prompt: 'Sigo?' };
const part = { id: 'p', kind: 'c3.tool', payload: {} };

describe('waitingFor', () => {
  it('nada pendente', () => {
    expect(waitingFor([msg('1')])).toBeUndefined();
    expect(waitingFor([msg('1', { question: { ...question, answer: { optionIds: ['s'] } } })])).toBeUndefined();
  });
  it('só a parte', () => {
    expect(waitingFor([msg('1', { ui: [part] }), msg('2')])).toEqual({ messageId: '1', kind: 'c3.tool', count: 1 });
  });
  it('só a pergunta', () => {
    expect(waitingFor([msg('1', { question }), msg('2')])).toEqual({ messageId: '1', kind: 'question', count: 1 });
  });
  it('as duas: a mais nova, contando as duas', () => {
    expect(waitingFor([msg('1', { question }), msg('2', { ui: [part] })])).toEqual({
      messageId: '2',
      kind: 'c3.tool',
      count: 2
    });
    expect(waitingFor([msg('1', { ui: [part] }), msg('2', { question })])).toEqual({
      messageId: '2',
      kind: 'question',
      count: 2
    });
  });
  it('na mesma mensagem, a parte', () => {
    expect(waitingFor([msg('1', { question, ui: [part] })])?.kind).toBe('c3.tool');
  });
  it('parte vencida não conta', () => {
    const old = { ...part, expiresAt: '2026-01-01T00:00:00Z' };
    expect(waitingFor([msg('1', { ui: [old] })], Date.parse('2026-11-12T00:00:00Z'))).toBeUndefined();
  });
});

describe('shouldAnnounce', () => {
  it('só quando a pendência não está na última', () => {
    const list = [msg('1', { question }), msg('2')];
    expect(shouldAnnounce(list, waitingFor(list))).toBe(true);
    const last = [msg('1'), msg('2', { question })];
    expect(shouldAnnounce(last, waitingFor(last))).toBe(false);
    expect(shouldAnnounce(list, undefined)).toBe(false);
    expect(shouldAnnounce([], { messageId: '1', kind: 'question', count: 1 })).toBe(true);
  });
});
