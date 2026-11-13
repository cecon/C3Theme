// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import MessageBubble from '../MessageBubble';
import AssistantMessage from '../AssistantMessage';
import type { Message } from '../../core/types';
import PinnedMenu from './PinnedMenu';

afterEach(cleanup);
const message: Message = {
  id: '1',
  conversationId: 'c',
  direction: 'out',
  author: { id: 'me', name: 'Eu' },
  text: 'Olá',
  createdAt: '2026-01-01T00:00:00Z'
};
it('selo textual só para fixada true, na pessoa e no agente', () => {
  const ui = (fixed: unknown) => (
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <IntlProvider locale="pt-BR" onError={() => {}}>
        <MessageBubble message={{ ...message, meta: { fixada: fixed } }} />
        <AssistantMessage message={{ ...message, direction: 'in', meta: { fixada: fixed } }} />
      </IntlProvider>
    </ThemeProvider>
  );
  const view = render(ui(true));
  expect(screen.getAllByText('Fixada')).toHaveLength(2);
  for (const value of [false, undefined, 'true']) {
    view.rerender(ui(value));
    expect(screen.queryByText('Fixada')).toBeNull();
  }
});

it('menu mostra espera/erro, permite tentar de novo e navegar por item com rótulo declarado', () => {
  const onRetry = vi.fn();
  const onSelect = vi.fn();
  const ui = (loading: boolean, error?: string) => (
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <IntlProvider locale="pt-BR" onError={() => {}}>
        <PinnedMenu
          label="Minhas fixadas"
          loading={loading}
          error={error}
          onRetry={onRetry}
          onSelect={onSelect}
          items={[
            {
              messageId: message.id,
              author: message.author,
              direction: 'out',
              text: 'Trecho',
              createdAt: message.createdAt,
              pinnedAt: message.createdAt
            }
          ]}
        />
      </IntlProvider>
    </ThemeProvider>
  );
  const view = render(ui(true));
  fireEvent.click(screen.getByRole('button', { name: 'Minhas fixadas (1)' }));
  expect(screen.getByText('Carregando mensagens fixadas…')).toBeTruthy();
  view.rerender(ui(false, 'Sem rede'));
  fireEvent.click(screen.getByRole('menuitem', { name: /Sem rede/ }));
  expect(onRetry).toHaveBeenCalledOnce();
  view.rerender(ui(false));
  fireEvent.click(screen.getByRole('menuitem', { name: /Trecho/ }));
  expect(onSelect).toHaveBeenCalledWith('1');
});
