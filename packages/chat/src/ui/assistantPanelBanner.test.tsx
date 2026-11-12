// @vitest-environment jsdom
// AssistantPanel (#101): faixa abaixo do cabeçalho e, com erro na janela, nada de pedir a página antiga sozinho.
import { cleanup, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import type { Message } from '../core/types';
import AssistantPanel, { type AssistantChat } from './AssistantPanel';

afterEach(cleanup);
beforeAll(() => {
  Object.defineProperties(HTMLElement.prototype, {
    offsetHeight: { configurable: true, get: () => 600 },
    offsetWidth: { configurable: true, get: () => 400 },
    clientHeight: { configurable: true, get: () => 600 }
  });
  HTMLElement.prototype.scrollTo = function scrollTo() {};
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

const old: Message = {
  id: 'm1',
  conversationId: 'c',
  text: 'Resposta antiga',
  author: { id: 'agent', name: 'Agente', kind: 'agent' },
  direction: 'in',
  createdAt: '2026-11-12T12:00:00Z'
};

function panel(error: unknown, banner?: React.ReactNode) {
  const loadOlder = vi.fn(async () => {});
  const chat: AssistantChat = {
    conversationId: 'c',
    messages: [old],
    hasMore: true,
    loading: null,
    error,
    loadOlder,
    send: vi.fn(),
    retry: vi.fn(),
    stop: undefined,
    generating: false,
    answer: undefined
  } as unknown as AssistantChat;
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <IntlProvider locale="pt-BR" onError={() => {}}>
        <AssistantPanel chat={chat} title="Ajuda" banner={banner} />
      </IntlProvider>
    </ThemeProvider>
  );
  return loadOlder;
}

describe('AssistantPanel', () => {
  it('a faixa fica entre o cabeçalho e a conversa', () => {
    panel(null, <div role="alert">Sem rede</div>);
    const heading = screen.getByRole('heading', { name: 'Ajuda' });
    const alert = screen.getByRole('alert');
    const text = screen.getByText('Resposta antiga');
    expect(heading.compareDocumentPosition(alert) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(alert.compareDocumentPosition(text) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('com a página anterior pendente, pede sozinho; com erro na janela, não pede de novo', () => {
    expect(panel(null)).toHaveBeenCalled();
    cleanup();
    expect(panel(new Error('500'))).not.toHaveBeenCalled();
  });
});
