// @vitest-environment jsdom
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import type { Message } from '../../core/types';
import AssistantPanel, { type AssistantChat } from '../AssistantPanel';
import { message, wrap } from './hitl.test-utils';

// lista virtualizada: sem altura, o jsdom não desenha linha nenhuma
const scrolls: unknown[] = [];
beforeAll(() => {
  Object.defineProperties(HTMLElement.prototype, {
    offsetHeight: { configurable: true, get: () => 600 },
    offsetWidth: { configurable: true, get: () => 400 },
    clientHeight: { configurable: true, get: () => 600 }
  });
  HTMLElement.prototype.scrollTo = function scrollTo(...args: unknown[]) {
    scrolls.push(args);
  };
});
afterEach(cleanup);

const tool = { tool: { name: 'enviar', label: 'Enviar e-mail' }, args: { para: 'ana@x.com' } };
const at = (i: number, extra: Partial<Message> = {}): Message => ({
  ...message,
  id: `m${i}`,
  createdAt: `2026-11-12T10:0${i}:00Z`,
  text: `resposta ${i}`,
  ...extra
});

const chatOf = (messages: Message[], answerUi = vi.fn().mockResolvedValue(true)): AssistantChat => ({
  conversationId: 'c1',
  messages,
  hasMore: false,
  loading: false,
  loadOlder: vi.fn(),
  send: vi.fn(),
  retry: vi.fn(),
  stop: vi.fn(),
  generating: false,
  answer: vi.fn(),
  answerUi
});

describe('AssistantPanel com HITL', () => {
  it('desenha as partes de HITL sem catálogo do app e responde', async () => {
    const answerUi = vi.fn().mockResolvedValue(true);
    wrap(<AssistantPanel chat={chatOf([at(1, { ui: [{ id: 'p1', kind: 'c3.tool', payload: tool }] })], answerUi)} />);
    expect(screen.getByText('O assistente quer usar Enviar e-mail')).toBeTruthy();
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Aprovar' })));
    expect(answerUi).toHaveBeenCalledWith('m1', 'p1', { action: 'accept', values: { args: tool.args, edited: [] } });
  });

  it('o catálogo do app troca o padrão', () => {
    const renderers = { 'c3.tool': () => <p>meu card</p> };
    wrap(<AssistantPanel chat={chatOf([at(1, { ui: [{ id: 'p1', kind: 'c3.tool', payload: tool }] })])} uiRenderers={renderers} />);
    expect(screen.getByText('meu card')).toBeTruthy();
  });

  it('avisa a pendência que ficou para trás e rola até ela', () => {
    const messages = [at(1, { question: { id: 'q', prompt: 'Sigo?' } }), at(2)];
    wrap(<AssistantPanel chat={chatOf(messages)} />);
    expect(screen.getByRole('status').textContent).toContain('O assistente espera você');
    const before = scrolls.length;
    fireEvent.click(screen.getByRole('button', { name: 'Ver' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ver' }));
    expect(scrolls.length).toBeGreaterThan(before);
  });

  it('sem aviso quando a pendência está na última resposta', () => {
    wrap(<AssistantPanel chat={chatOf([at(1), at(2, { question: { id: 'q', prompt: 'Sigo?' } })])} />);
    expect(screen.queryByText('O assistente espera você')).toBeNull();
  });

  it('conta as pendências', () => {
    const messages = [
      at(1, { question: { id: 'q', prompt: 'Sigo?' } }),
      at(2, { ui: [{ id: 'p', kind: 'c3.plan', payload: { steps: [{ id: 'a', text: 'x' }] } }] }),
      at(3)
    ];
    wrap(<AssistantPanel chat={chatOf(messages)} />);
    expect(screen.getByText('2 pendências esperam você')).toBeTruthy();
  });
});
