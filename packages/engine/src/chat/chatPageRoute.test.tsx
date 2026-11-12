// @vitest-environment jsdom
// Página de chat com a conversa vinda da rota (#100, ADR 0009): abre a do parâmetro, trocar pela navegação não mistura
// histórico nem rascunho, e um id que as rotas /_chat recusariam vira aviso em vez de pedido.
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { memoryTransport, type Message } from '@c3theme/chat';

import type { C3Client } from '../api';
import { EngineProvider } from '../context';
import { createMemoryClient } from '../memory/memoryClient';
import ChatPage from './ChatPage';
import type { ChatDef } from './chatDef';

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
afterEach(cleanup);

const said = (conversationId: string, text: string): Message => ({
  id: `m-${conversationId}`,
  conversationId,
  author: { id: 'bot', name: 'Assistente', kind: 'agent' },
  direction: 'in',
  text,
  createdAt: '2026-11-12T12:00:00Z'
});

function mount(def: ChatDef, path: string, at: string) {
  const t = memoryTransport([
    said('pedido-1', 'Histórico do pedido 1'),
    said('pedido-2', 'Histórico do pedido 2'),
    said('assistant', 'Conversa padrão')
  ]);
  const load = vi.spyOn(t.transport, 'loadMessages');
  const client: C3Client = createMemoryClient({ app: { name: 'x' } as never, entities: [], chat: t.transport });
  const router = createMemoryRouter([{ path, element: <ChatPage def={def} path={path} /> }], { initialEntries: [at] });
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <IntlProvider locale="pt-BR" onError={() => {}}>
        <EngineProvider value={{ client, app: { name: 'x' } as never, entities: {}, components: {} }}>
          <RouterProvider router={router} />
        </EngineProvider>
      </IntlProvider>
    </ThemeProvider>
  );
  return { router, opened: () => load.mock.calls.map((c) => c[0]) };
}

describe('ChatPage com a conversa da rota', () => {
  it('`{conversation}` abre a conversa do parâmetro', async () => {
    const { opened } = mount({ conversation: '{conversation}' }, '/conversa/:conversation', '/conversa/pedido-1');
    expect(await screen.findByText('Histórico do pedido 1')).toBeTruthy();
    expect(opened()).toEqual(['pedido-1']);
  });

  it('navegar entre duas conversas não mistura histórico nem rascunho', async () => {
    const { router } = mount({ conversation: '{id}' }, '/conversa/:id', '/conversa/pedido-1');
    expect(await screen.findByText('Histórico do pedido 1')).toBeTruthy();
    const box = () => screen.getByRole('textbox') as HTMLTextAreaElement;
    fireEvent.change(box(), { target: { value: 'rascunho do pedido 1' } });
    expect(box().value).toBe('rascunho do pedido 1');
    await act(() => router.navigate('/conversa/pedido-2'));
    expect(await screen.findByText('Histórico do pedido 2')).toBeTruthy();
    expect(screen.queryByText('Histórico do pedido 1')).toBeNull();
    expect(box().value).toBe('');
  });

  it('sem `conversation` na spec, `:conversation` na rota também vale', async () => {
    mount({}, '/conversa/:conversation', '/conversa/pedido-2');
    expect(await screen.findByText('Histórico do pedido 2')).toBeTruthy();
  });

  it('rota sem parâmetro continua com o id da spec (ou o padrão)', async () => {
    const { opened } = mount({}, '/assistente', '/assistente');
    expect(await screen.findByText('Conversa padrão')).toBeTruthy();
    expect(opened()).toEqual(['assistant']);
  });

  it('id inválido na rota avisa e não chama o backend', () => {
    const { opened } = mount({ conversation: '{conversation}' }, '/conversa/:conversation', '/conversa/n%C3%A3o%20vale');
    expect(screen.getByText('Conversa não encontrada: o endereço não traz uma conversa válida.')).toBeTruthy();
    expect(opened()).toEqual([]);
  });
});
