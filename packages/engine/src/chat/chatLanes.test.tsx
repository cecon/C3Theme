// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { memoryTransport, type Message } from '@c3theme/chat';
import { EngineProvider } from '../context';
import { createMemoryClient } from '../memory/memoryClient';
import type { C3Client } from '../api';
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

const reply: Message = {
  id: 'm1',
  conversationId: 'assistant',
  direction: 'in',
  author: { id: 'bot', name: 'Agente', kind: 'agent' },
  text: 'Resposta da principal',
  createdAt: '2026-11-12T12:00:00Z'
};
const lane = { id: 'child', parentId: 'assistant', title: 'Ramo separado', kind: 'branch', updatedAt: reply.createdAt };
const ok = (data: unknown, status = 200) => ({ status, contentType: 'application/json', body: JSON.stringify(data) });

function mount(raw?: C3Client['raw'], def: ChatDef = { lanes: {} }) {
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

describe('chat declarado com subconversas', () => {
  it('abre ramo da mensagem pela API e mantém a conversa principal montada', async () => {
    const raw = vi
      .fn<NonNullable<C3Client['raw']>>()
      .mockImplementation(async (method) => (method === 'GET' ? ok({ data: [] }) : ok({ data: lane }, 201)));
    const mem = mount(raw);
    await screen.findByText('Resposta da principal');
    fireEvent.change(screen.getByRole('textbox', { name: 'Mensagem' }), { target: { value: 'Rascunho principal' } });
    fireEvent.click(screen.getByRole('button', { name: 'Mais ações' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Ramificar daqui' }));
    await screen.findByRole('heading', { name: 'Ramo separado' });
    expect(raw).toHaveBeenCalledWith('POST', '/_chat/assistant/_lanes', JSON.stringify({ kind: 'branch', fromMessageId: 'm1' }));
    const boxes = screen.getAllByRole('textbox', { name: 'Mensagem' }) as HTMLTextAreaElement[];
    expect(boxes[0].value).toBe('Rascunho principal');
    fireEvent.change(boxes[1], { target: { value: 'Pergunta filha' } });
    fireEvent.keyDown(boxes[1], { key: 'Enter' });
    await screen.findByText('Pergunta filha');
    const child = await mem.transport.loadMessages('child', { limit: 30 });
    expect(child.messages.map((m) => m.text)).toContain('Pergunta filha');
    const main = await mem.transport.loadMessages('assistant', { limit: 30 });
    expect(main.messages.map((m) => m.text)).not.toContain('Pergunta filha');
    fireEvent.click(screen.getByRole('button', { name: 'Voltar às conversas à parte' }));
    expect(await screen.findByRole('list', { name: 'Conversas à parte' })).toBeTruthy();
  });

  it('recurso ausente (404) esconde painel e botões; cliente sem raw também', async () => {
    mount(async () => ok({ error: { code: 'not_found', message: 'Sem recurso' } }, 404));
    await screen.findByText('Resposta da principal');
    await waitFor(() => expect(screen.queryByRole('button', { name: 'À parte' })).toBeNull());
    expect(screen.queryByRole('button', { name: 'Mais ações' })).toBeNull();
    cleanup();
    mount();
    await screen.findByText('Resposta da principal');
    expect(screen.queryByText('Conversas à parte')).toBeNull();
  });

  it('uma falha ao abrir mantém o rascunho; a ação personalizada usa a rota de ações', async () => {
    const raw = vi
      .fn<NonNullable<C3Client['raw']>>()
      .mockImplementation(async (method) =>
        method === 'GET' ? ok({ data: [] }) : ok({ error: { code: 'internal', message: 'Tente novamente' } }, 500)
      );
    mount(raw, { lanes: {}, messageActions: [{ id: 'fixar', label: 'Fixar resposta' }] });
    await screen.findByText('Resposta da principal');
    const box = screen.getByRole('textbox', { name: 'Mensagem' }) as HTMLTextAreaElement;
    fireEvent.change(box, { target: { value: 'Não perder isto' } });
    fireEvent.click(screen.getByRole('button', { name: 'À parte' }));
    await screen.findByText('Tente novamente');
    expect(box.value).toBe('Não perder isto');
    fireEvent.click(screen.getByRole('button', { name: 'Mais ações' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Fixar resposta' }));
    await waitFor(() => expect(raw).toHaveBeenCalledWith('POST', '/_chat/assistant/messages/m1/_actions/fixar', undefined));
  });
});
