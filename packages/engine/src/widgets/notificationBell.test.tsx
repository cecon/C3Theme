// @vitest-environment jsdom
// Sino do header (#155): contador do servidor, clicar marca como lido e navega, evento novo relê.
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { SWRConfig } from 'swr';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { C3Client, C3Notification } from '../api';
import { EngineProvider } from '../context';
import type { LiveMessage } from '../live/sse';
import { createMemoryClient } from '../memory/memoryClient';
import NotificationBell, { timeAgo } from './NotificationBell';

afterEach(cleanup);

const items: C3Notification[] = [
  { id: 'n1', title: 'Agente terminou', createdAt: '2026-11-09T10:00:00Z', readAt: null, to: '/conversa/7' },
  { id: 'n2', title: 'Versão nova', createdAt: '2026-11-09T09:00:00Z', readAt: '2026-11-09T09:30:00Z' }
];

function setup(client: C3Client) {
  const router = createMemoryRouter(
    [
      { path: '/', element: <NotificationBell /> },
      { path: '/conversa/:id', element: <p>conversa aberta</p> }
    ],
    { initialEntries: ['/'] }
  );
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <IntlProvider locale="pt-BR" onError={() => {}}>
        <SWRConfig value={{ provider: () => new Map() }}>
          <EngineProvider value={{ client, app: { name: 'x' } as never, entities: {}, components: {} }}>
            <RouterProvider router={router} />
          </EngineProvider>
        </SWRConfig>
      </IntlProvider>
    </ThemeProvider>
  );
}

const memory = () => createMemoryClient({ app: { name: 'x' } as never, entities: [], notifications: items });

describe('NotificationBell', () => {
  it('mostra as não lidas; clicar marca como lido e abre o `to`', async () => {
    const client = memory();
    const read = vi.spyOn(client, 'readNotifications');
    setup(client);
    fireEvent.click(await screen.findByRole('button', { name: 'Notificações, 1 não lidas' }));
    fireEvent.click(screen.getByText('Agente terminou'));
    expect(await screen.findByText('conversa aberta')).toBeTruthy();
    expect(read).toHaveBeenCalledWith(['n1']);
    expect((await client.notifications!()).unread).toBe(0);
  });

  it('aviso novo pelo tempo real relê a lista', async () => {
    let push: (m: LiveMessage) => void = () => {};
    const list = vi.fn().mockResolvedValueOnce({ items: [], unread: 0 }).mockResolvedValue({ items, unread: 1 });
    const client = {
      notifications: list,
      notificationEvents: (on: (m: LiveMessage) => void, signal: AbortSignal) => {
        push = on;
        return new Promise<void>((resolve) => signal.addEventListener('abort', () => resolve()));
      }
    } as unknown as C3Client;
    setup(client);
    expect(await screen.findByRole('button', { name: 'Notificações' })).toBeTruthy();
    push({ type: 'notification' });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Notificações, 1 não lidas' })).toBeTruthy());
  });

  it('memória marca todas sem ids', async () => {
    const client = memory();
    expect(await client.readNotifications!()).toEqual({ unread: 0 });
    expect((await client.notifications!(1)).items).toHaveLength(1);
  });

  it('timeAgo no idioma da tela', () => {
    expect(timeAgo('2026-11-09T10:00:00Z', 'pt-BR', Date.parse('2026-11-09T10:05:00Z'))).toMatch(/5 min/);
  });
});
