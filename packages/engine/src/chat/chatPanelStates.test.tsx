// @vitest-environment jsdom
// Estados declarados no chat (#101): carregando, vazio com ação e sugestões, erro com "Tentar de novo" que recarrega o
// histórico, 403 cobrindo o painel e offline com o histórico visível. Sem `states`, o painel de sempre.
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { memoryTransport, type ChatTransport, type Message } from '@c3theme/chat';

import { ApiError } from '../apiError';
import type { C3Client } from '../api';
import { EngineProvider } from '../context';
import { createMemoryClient } from '../memory/memoryClient';
import ChatPanel from './ChatPanel';
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

const old: Message = {
  id: 'm1',
  conversationId: 'assistant',
  author: { id: 'bot', name: 'Assistente', kind: 'agent' },
  direction: 'in',
  text: 'Resposta antiga',
  createdAt: '2026-11-12T12:00:00Z'
};

const def: ChatDef = {
  suggestions: ['Quanto vendi hoje?'],
  states: {
    loading: { text: 'Abrindo a conversa…' },
    empty: { text: 'Nenhum agente respondeu ainda.', action: { label: 'Ver agentes', path: '/agentes' } },
    error: { text: 'O servidor não respondeu.', retry: 'Carregar de novo' },
    forbidden: {
      text: 'Você não pode usar o assistente.',
      howTo: 'Peça o papel Agentes ao administrador.',
      action: { label: 'Pedir acesso', href: 'https://exemplo.dev/acesso' }
    },
    offline: { text: 'Você está sem rede.', keeps: ['O histórico continua visível.'] }
  }
};

function mount(node: React.ReactNode, chat?: ChatTransport) {
  const client: C3Client = createMemoryClient({ app: { name: 'x' } as never, entities: [], chat });
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <IntlProvider locale="pt-BR" onError={() => {}}>
        <MemoryRouter>
          <EngineProvider value={{ client, app: { name: 'x' } as never, entities: {}, components: {} }}>{node}</EngineProvider>
        </MemoryRouter>
      </IntlProvider>
    </ThemeProvider>
  );
}

const failing = (first: unknown, messages: Message[] = []): ChatTransport => {
  const t = memoryTransport(messages).transport;
  let calls = 0;
  return { ...t, loadMessages: (...args) => (calls++ === 0 ? Promise.reject(first) : t.loadMessages(...args)) };
};

describe('ChatPanel com states', () => {
  it('abrindo mostra o carregando da spec', async () => {
    const t = memoryTransport().transport;
    mount(<ChatPanel def={def} />, { ...t, loadMessages: () => new Promise(() => {}) });
    expect(await screen.findByRole('status')).toBeTruthy();
    expect(screen.getByText('Abrindo a conversa…')).toBeTruthy();
  });

  it('vazia mostra o texto, a ação e as sugestões, que enviam', async () => {
    mount(<ChatPanel def={def} />, memoryTransport().transport);
    expect(await screen.findByText('Nenhum agente respondeu ainda.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Ver agentes' }).getAttribute('href')).toBe('/agentes');
    fireEvent.click(screen.getByText('Quanto vendi hoje?'));
    expect(await screen.findByText('Quanto vendi hoje?')).toBeTruthy();
    expect(screen.queryByText('Nenhum agente respondeu ainda.')).toBeNull();
  });

  it('5xx ao abrir mostra o erro; "Tentar de novo" recarrega o histórico', async () => {
    mount(<ChatPanel def={def} />, failing(new ApiError(500, 'internal', 'x'), [old]));
    expect(await screen.findByText('O servidor não respondeu.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Carregar de novo' }));
    expect(await screen.findByText('Resposta antiga')).toBeTruthy();
    expect(screen.queryByText('O servidor não respondeu.')).toBeNull();
  });

  it('403 cobre o painel com como conceder e a ação; o X continua fechando', async () => {
    const onClose = vi.fn();
    mount(<ChatPanel def={{ ...def, title: 'Ajuda' }} onClose={onClose} />, failing(new ApiError(403, 'forbidden', 'x')));
    expect(await screen.findByText('Você não pode usar o assistente.')).toBeTruthy();
    expect(screen.getByText('Peça o papel Agentes ao administrador.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Pedir acesso' }).getAttribute('href')).toBe('https://exemplo.dev/acesso');
    expect(screen.queryByRole('textbox', { name: 'Mensagem' })).toBeNull();
    expect(screen.getByRole('heading', { name: 'Ajuda' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('sem rede ao abrir mostra o offline com o que continua funcionando', async () => {
    mount(<ChatPanel def={def} />, failing(new ApiError(0, 'network', 'x')));
    expect(await screen.findByText('Você está sem rede.')).toBeTruthy();
    expect(screen.getByText('O histórico continua visível.')).toBeTruthy();
    expect(screen.queryByText('Quanto vendi hoje?')).toBeNull();
  });

  it('quando a rede volta, a conversa que abriu sem rede abre de novo sozinha (uma vez)', async () => {
    const t = failing(new ApiError(0, 'network', 'x'), [old]);
    const load = vi.spyOn(t, 'loadMessages');
    mount(<ChatPanel def={def} />, t);
    expect(await screen.findByText('Você está sem rede.')).toBeTruthy();
    await new Promise((r) => setTimeout(r, 30));
    expect(load).toHaveBeenCalledTimes(1);
    act(() => void window.dispatchEvent(new Event('offline')));
    act(() => void window.dispatchEvent(new Event('online')));
    expect(await screen.findByText('Resposta antiga')).toBeTruthy();
    expect(screen.queryByText('Você está sem rede.')).toBeNull();
  });

  it('o navegador sem rede põe a faixa offline sobre o histórico, que fica visível', async () => {
    mount(<ChatPanel def={def} />, memoryTransport([old]).transport);
    expect(await screen.findByText('Resposta antiga')).toBeTruthy();
    act(() => void window.dispatchEvent(new Event('offline')));
    expect(within(await screen.findByRole('alert')).getByText('Você está sem rede.')).toBeTruthy();
    expect(screen.getByText('O histórico continua visível.')).toBeTruthy();
    expect(screen.getByText('Resposta antiga')).toBeTruthy();
    act(() => void window.dispatchEvent(new Event('online')));
    expect(screen.queryByText('Você está sem rede.')).toBeNull();
  });

  it('erro de envio com histórico vai na faixa; "Tentar de novo" reenvia sem perder a mensagem', async () => {
    const t = memoryTransport([old]).transport;
    let sends = 0;
    const send: ChatTransport['send'] = (m) => (sends++ === 0 ? Promise.reject(new ApiError(502, 'bad_gateway', 'x')) : t.send(m));
    mount(<ChatPanel def={def} />, { ...t, send });
    expect(await screen.findByText('Resposta antiga')).toBeTruthy();
    const box = screen.getByRole('textbox', { name: 'Mensagem' });
    fireEvent.change(box, { target: { value: 'oi' } });
    fireEvent.keyDown(box, { key: 'Enter' });
    const banner = await screen.findByRole('alert');
    fireEvent.click(within(banner).getByRole('button', { name: 'Carregar de novo' }));
    await vi.waitFor(() => expect(screen.queryByText('O servidor não respondeu.')).toBeNull());
    expect(sends).toBe(2);
    expect(screen.getByText('oi')).toBeTruthy();
    expect(screen.getByText('Resposta antiga')).toBeTruthy();
  });

  it('página antiga que não veio fica na faixa; "Tentar de novo" busca de novo', async () => {
    const t = memoryTransport([old]).transport;
    let loads = 0;
    const loadMessages: ChatTransport['loadMessages'] = (...args) =>
      loads++ === 0 ? t.loadMessages(...args).then((p) => ({ ...p, hasMore: true })) : Promise.reject(new ApiError(500, 'internal', 'x'));
    mount(<ChatPanel def={def} />, { ...t, loadMessages });
    expect(await screen.findByText('Resposta antiga')).toBeTruthy();
    // a lista pede a página anterior sozinha quando cabe na tela
    const banner = await screen.findByRole('alert');
    expect(within(banner).getByText('O servidor não respondeu.')).toBeTruthy();
    // a falha não vira laço: o painel para de pedir a página até alguém tentar de novo
    await new Promise((r) => setTimeout(r, 50));
    expect(loads).toBe(2);
    fireEvent.click(within(banner).getByRole('button', { name: 'Carregar de novo' }));
    await vi.waitFor(() => expect(loads).toBe(3));
    expect(screen.getByText('Resposta antiga')).toBeTruthy();
  });

  it('a rede que volta sem falha de rede não reabre a conversa', async () => {
    const t = memoryTransport([old]).transport;
    const load = vi.spyOn(t, 'loadMessages');
    mount(<ChatPanel def={def} />, t);
    expect(await screen.findByText('Resposta antiga')).toBeTruthy();
    const before = load.mock.calls.length;
    act(() => void window.dispatchEvent(new Event('offline')));
    act(() => void window.dispatchEvent(new Event('online')));
    await new Promise((r) => setTimeout(r, 30));
    expect(load.mock.calls.length).toBe(before);
  });

  it('"Tentar de novo" sem histórico tira o erro e mostra o carregando enquanto abre', async () => {
    const t = memoryTransport().transport;
    let calls = 0;
    const loadMessages: ChatTransport['loadMessages'] = () =>
      calls++ === 0 ? Promise.reject(new ApiError(503, 'unavailable', 'x')) : new Promise(() => {});
    mount(<ChatPanel def={def} />, { ...t, loadMessages });
    fireEvent.click(await screen.findByRole('button', { name: 'Carregar de novo' }));
    expect(await screen.findByText('Abrindo a conversa…')).toBeTruthy();
    expect(screen.queryByText('O servidor não respondeu.')).toBeNull();
  });

  it('com states e sem chat no backend, avisa que o sistema não tem assistente', () => {
    mount(<ChatPanel def={def} />);
    expect(screen.getByText('Este sistema não tem assistente.')).toBeTruthy();
  });

  it('sem states, 403 ao abrir não cobre o painel', async () => {
    mount(<ChatPanel def={{ title: 'Ajuda' }} />, failing(new ApiError(403, 'forbidden', 'x')));
    expect(await screen.findByText('Ajuda')).toBeTruthy();
    expect(screen.getByRole('textbox', { name: 'Mensagem' })).toBeTruthy();
    expect(screen.queryByText('Você não pode usar o assistente.')).toBeNull();
  });
});
