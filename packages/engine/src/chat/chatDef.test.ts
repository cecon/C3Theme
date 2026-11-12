import { describe, expect, it } from 'vitest';

import { AGENT_KINDS, chatRenderers, chatView, headerChat } from './chatDef';

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
      queue: true
    });
    expect(
      chatView(
        { conversation: 'vendas', title: { id: 'chat.t' }, placeholder: 'Pergunte', suggestions: ['a', { id: 'b' }], queue: false },
        text
      )
    ).toEqual({ conversation: 'vendas', title: '[chat.t]', placeholder: 'Pergunte', suggestions: ['a', '[b]'], queue: false });
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
