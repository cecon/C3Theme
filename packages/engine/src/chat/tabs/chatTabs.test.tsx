// @vitest-environment jsdom
// Faixa de abas das threads no painel central (#134): a conversa principal fica montada, as laterais abrem em aba.
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { memoryTransport, type Message } from '@c3theme/chat';

import { EngineProvider } from '../../context';
import { createMemoryClient } from '../../memory/memoryClient';
import type { C3Client } from '../../api';
import ChatPanel from '../ChatPanel';
import type { ChatDef } from '../chatDef';

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
afterEach(() => {
  cleanup();
  localStorage.clear();
});

const reply: Message = {
  id: 'm1',
  conversationId: 'assistant',
  direction: 'in',
  author: { id: 'bot', name: 'Agente', kind: 'agent' },
  text: 'Resposta da principal',
  createdAt: '2026-11-12T12:00:00Z'
};
const at = reply.createdAt;
const working = { id: 'w', parentId: 'assistant', title: 'Pesquisa', kind: 'aside', updatedAt: at, working: true };
const branch = { id: 'b', parentId: 'assistant', title: 'Ramo separado', kind: 'branch', updatedAt: at };
const ok = (data: unknown, status = 200) => ({ status, contentType: 'application/json', body: JSON.stringify(data) });

function mount(raw: C3Client['raw'], def: ChatDef = { lanes: {}, tabs: {} }) {
  const mem = memoryTransport([reply]);
  const client = createMemoryClient({ app: { name: 'x' } as never, entities: [], chat: mem.transport });
  client.raw = raw;
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <IntlProvider locale="pt-BR" onError={() => {}}>
        <EngineProvider value={{ client, app: { name: 'x' } as never, entities: {}, components: {} }}>
          <ChatPanel def={def} />
        </EngineProvider>
      </IntlProvider>
    </ThemeProvider>
  );
  return mem;
}
const lanesRaw = (list: unknown[], opened: unknown = branch) =>
  vi
    .fn<NonNullable<C3Client['raw']>>()
    .mockImplementation(async (method) => (method === 'GET' ? ok({ data: list }) : ok({ data: opened }, 201)));
const tab = (name: RegExp | string) => screen.getByRole('tab', { name });

describe('abas das threads no chat (#134)', () => {
  it('ramo da mensagem abre em aba ativa; voltar à principal mantém o rascunho dela', async () => {
    const raw = lanesRaw([]);
    mount(raw);
    await screen.findByText('Resposta da principal');
    expect(tab('Assistente').getAttribute('aria-selected')).toBe('true');
    const box = screen.getByRole('textbox', { name: 'Mensagem' }) as HTMLTextAreaElement;
    fireEvent.change(box, { target: { value: 'Rascunho principal' } });
    fireEvent.click(screen.getByRole('button', { name: 'Mais ações' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Ramificar daqui' }));
    await waitFor(() => expect(tab('Ramo separado').getAttribute('aria-selected')).toBe('true'));
    expect(screen.queryByRole('list', { name: 'Conversas à parte' })).toBeNull();
    fireEvent.click(tab('Assistente'));
    expect(box.value).toBe('Rascunho principal');
    expect(JSON.parse(localStorage.getItem('c3.chat.tabs/x/assistant')!).open).toEqual(['b']);
  });

  it('thread lateral fechada fica para reabrir; estado vai no nome; ordem guardada volta ao montar de novo', async () => {
    const raw = lanesRaw([working, branch]);
    localStorage.setItem('c3.chat.tabs/x/assistant', JSON.stringify({ open: ['b', 'sumiu'], names: { b: 'Meu ramo' } }));
    mount(raw);
    expect(await screen.findByRole('tab', { name: 'Meu ramo' })).toBeTruthy();
    await waitFor(() => expect(JSON.parse(localStorage.getItem('c3.chat.tabs/x/assistant')!).open).toEqual(['b']));
    fireEvent.click(screen.getByRole('button', { name: 'Todas as abas' }));
    const menu = await screen.findByRole('menu');
    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Pesquisa' }));
    await waitFor(() => expect(tab('Pesquisa, executando').getAttribute('aria-selected')).toBe('true'));
    fireEvent.keyDown(tab(/Pesquisa/), { key: 'Delete' });
    await waitFor(() => expect(tab('Meu ramo').getAttribute('aria-selected')).toBe('true'));
    expect(screen.queryByRole('tab', { name: /Pesquisa/ })).toBeNull();
  });

  it('"+" abre rascunho que só vai ao servidor ao enviar e vira a thread criada', async () => {
    const created = { ...working, id: 'novo', title: 'Pergunta nova', working: false };
    const raw = lanesRaw([], created);
    mount(raw);
    await screen.findByText('Resposta da principal');
    fireEvent.click(screen.getByRole('button', { name: 'Nova thread' }));
    expect(tab('Nova thread').getAttribute('aria-selected')).toBe('true');
    expect(raw).not.toHaveBeenCalledWith('POST', expect.anything(), expect.anything());
    const boxes = screen.getAllByRole('textbox', { name: 'Mensagem' });
    const draft = boxes[boxes.length - 1];
    fireEvent.change(draft, { target: { value: 'Pergunta nova' } });
    fireEvent.keyDown(draft, { key: 'Enter' });
    await waitFor(() => expect(tab('Pergunta nova').getAttribute('aria-selected')).toBe('true'));
    expect(raw).toHaveBeenCalledWith('POST', '/_chat/assistant/_lanes', JSON.stringify({ kind: 'aside', text: 'Pergunta nova' }));
    expect(screen.queryByRole('tab', { name: 'Nova thread' })).toBeNull();
  });

  it('atalhos declarados trocam, abrem e fecham; dentro do campo de texto não disparam', async () => {
    const raw = lanesRaw([branch]);
    localStorage.setItem('c3.chat.tabs/x/assistant', JSON.stringify({ open: ['b'], names: {} }));
    mount(raw, { lanes: {}, tabs: { shortcuts: { next: 'Ctrl+Tab', previous: 'Ctrl+Shift+Tab', new: 'Alt+T', close: 'Alt+W' } } });
    await screen.findByRole('tab', { name: 'Ramo separado' });
    fireEvent.keyDown(screen.getAllByRole('textbox', { name: 'Mensagem' })[0], { key: 'Tab', code: 'Tab', ctrlKey: true });
    expect(tab('Assistente').getAttribute('aria-selected')).toBe('true');
    act(() => void window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', code: 'Tab', ctrlKey: true })));
    expect(tab('Ramo separado').getAttribute('aria-selected')).toBe('true');
    act(() => void window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', code: 'Tab', ctrlKey: true, shiftKey: true })));
    expect(tab('Assistente').getAttribute('aria-selected')).toBe('true');
    act(() => void window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w', code: 'KeyW', altKey: true })));
    expect(screen.getByRole('tab', { name: 'Ramo separado' })).toBeTruthy();
    act(() => void window.dispatchEvent(new KeyboardEvent('keydown', { key: 't', code: 'KeyT', altKey: true })));
    expect(tab('Nova thread').getAttribute('aria-selected')).toBe('true');
    act(() => void window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w', code: 'KeyW', altKey: true })));
    expect(screen.queryByRole('tab', { name: 'Nova thread' })).toBeNull();
    act(() => void window.dispatchEvent(new KeyboardEvent('keydown', { key: 'x', code: 'KeyX', altKey: true })));
  });

  it('erro ao listar mostra a mensagem na faixa e tenta de novo', async () => {
    let fail = true;
    const raw = vi
      .fn<NonNullable<C3Client['raw']>>()
      .mockImplementation(async () =>
        fail ? ok({ error: { code: 'internal', message: 'Lista fora do ar' } }, 500) : ok({ data: [branch] })
      );
    mount(raw);
    await screen.findByText('Lista fora do ar');
    fail = false;
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByRole('tab', { name: 'Assistente' })).toBeTruthy();
  });

  it('sem `tabs`, nada de faixa; com `tabs` e sem recurso de threads (404), só a aba principal e sem "+"', async () => {
    mount(lanesRaw([]), { lanes: {} });
    await screen.findByText('Resposta da principal');
    expect(screen.queryByRole('tablist')).toBeNull();
    cleanup();
    mount(async () => ok({ error: { code: 'not_found', message: 'Sem recurso' } }, 404), { tabs: { main: 'Principal' } });
    await screen.findByText('Resposta da principal');
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Nova thread' })).toBeNull());
    expect(screen.getAllByRole('tab').map((t) => t.getAttribute('aria-label'))).toEqual(['Principal']);
  });
});
