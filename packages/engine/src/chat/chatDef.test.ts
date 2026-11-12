import { describe, expect, it } from 'vitest';

import { AGENT_KINDS, chatRenderers, chatView, headerChat, pageConversation } from './chatDef';

const text = (t: unknown, fallback = '') => (t === undefined ? fallback : typeof t === 'string' ? t : `[${(t as { id: string }).id}]`);

describe('chatDef', () => {
  it('header.assistant: true é o padrão; false, ausente ou valor estranho não têm botão', () => {
    expect(headerChat(true)).toEqual({});
    expect(headerChat({ title: 'Ajuda' })).toEqual({ title: 'Ajuda' });
    expect(headerChat(false)).toBeNull();
    expect(headerChat(undefined)).toBeNull();
    expect(headerChat('sim' as never)).toBeNull();
  });

  it('chatView traduz e completa o padrão', () => {
    expect(chatView({}, text)).toEqual({
      conversation: 'assistant',
      title: 'Assistente',
      placeholder: undefined,
      suggestions: [],
      queue: true,
      sendKey: 'enter',
      steer: false
    });
    expect(
      chatView(
        { conversation: 'vendas', title: { id: 'chat.t' }, placeholder: 'Pergunte', suggestions: ['a', { id: 'b' }], queue: false },
        text
      )
    ).toMatchObject({ conversation: 'vendas', title: '[chat.t]', placeholder: 'Pergunte', suggestions: ['a', '[b]'], queue: false });
    expect(chatView({ sendKey: 'modEnter', steer: true }, text)).toMatchObject({ sendKey: 'modEnter', steer: true });
    expect(chatView({ sendKey: 'outra' as never, steer: 'sim' as never }, text)).toMatchObject({ sendKey: 'enter', steer: false });
  });

  it('chatRenderers: os do motor que a conversa aceita e um buraco para cada kind fora de `parts`', () => {
    const engine = { 'c3.form': 'F', 'c3.record': 'R', 'c3.action': 'A' };
    expect(chatRenderers({}, engine)).toEqual(engine);
    const only = chatRenderers({ parts: ['c3.form', 'c3.tool'] }, engine);
    expect(only).toEqual({ 'c3.form': 'F', 'c3.record': undefined, 'c3.action': undefined, 'c3.plan': undefined, 'c3.browser': undefined });
    // o de humano no circuito aceito fica com o padrão do painel (sem chave)
    expect(Object.hasOwn(only, 'c3.tool')).toBe(false);
    expect(Object.hasOwn(only, 'c3.plan')).toBe(true);
    expect(AGENT_KINDS).toHaveLength(6);
  });
});

describe('pageConversation (#100)', () => {
  it('lê o parâmetro pedido pela spec; sem pedido, fica o id da spec', () => {
    expect(pageConversation({ conversation: '{id}' }, '/c/:id', { id: 'p-1' })).toBe('p-1');
    expect(pageConversation({}, '/c/:conversation', { conversation: 'p_2' })).toBe('p_2');
    expect(pageConversation({ conversation: 'fixa' }, '/c/:conversation', { conversation: 'outra' })).toBe('fixa');
    expect(pageConversation({}, '/assistente', {})).toBeUndefined();
  });

  it('parâmetro ausente ou fora de ^[A-Za-z0-9_-]{1,64}$ vira null', () => {
    expect(pageConversation({ conversation: '{id}' }, '/c/:id', {})).toBeNull();
    expect(pageConversation({ conversation: '{id}' }, '/c/:id', { id: 'não vale' })).toBeNull();
    expect(pageConversation({ conversation: '{id}' }, '/c/:id', { id: 'a'.repeat(65) })).toBeNull();
    expect(pageConversation({ conversation: '{id}' }, '/c/:id', { id: 'a'.repeat(64) })).toBe('a'.repeat(64));
  });
});
