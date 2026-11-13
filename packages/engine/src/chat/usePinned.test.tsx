// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { IntlProvider } from 'react-intl';
import type { PropsWithChildren } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { memoryTransport, useMessageWindow, type Message } from '@c3theme/chat';
import { EngineProvider } from '../context';
import { createMemoryClient } from '../memory/memoryClient';
import type { C3Client } from '../api';
import usePinned from './usePinned';

afterEach(cleanup);
const messages: Message[] = Array.from({ length: 65 }, (_, i) => ({
  id: `m${i}`,
  conversationId: 'a',
  direction: 'in',
  text: `Texto ${i}`,
  author: { id: 'b', name: 'Bot' },
  createdAt: new Date(2026, 0, 1, 0, i).toISOString()
}));
const item = {
  messageId: 'm0',
  author: messages[0].author,
  direction: 'in',
  text: 'Trecho antigo',
  createdAt: messages[0].createdAt,
  pinnedAt: messages[0].createdAt
};
function setup(status = 200, data = [item]) {
  const mem = memoryTransport(messages);
  const load = vi.spyOn(mem.transport, 'loadMessages');
  const raw = vi
    .fn<NonNullable<C3Client['raw']>>()
    .mockResolvedValue({ status, body: JSON.stringify({ data }), contentType: 'application/json' });
  const client = createMemoryClient({ app: { name: 'Teste' } as never, entities: [], chat: mem.transport });
  client.raw = raw;
  const wrapper = ({ children }: PropsWithChildren) => (
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <IntlProvider locale="pt-BR" onError={() => {}}>
        <EngineProvider value={{ client, app: { name: 'Teste' } as never, entities: {}, components: {} }}>{children}</EngineProvider>
      </IntlProvider>
    </ThemeProvider>
  );
  const hook = renderHook(
    () => {
      const chat = useMessageWindow(mem.transport, 'a', { me: { id: 'me', name: 'Eu' } });
      return { ...usePinned({ pinned: true }, chat, 0), chat };
    },
    { wrapper }
  );
  return { ...hook, wrapper, load, raw };
}
it('selecionar fixada carrega páginas antigas até encontrar e aciona o jump', async () => {
  const h = setup();
  await waitFor(() => expect(h.result.current.chat.loading).toBeNull());
  const ui = render(h.result.current.actions, { wrapper: h.wrapper });
  await waitFor(() => {
    ui.rerender(h.result.current.actions);
    expect(screen.getByRole('button', { name: 'Fixada (1)' })).toBeTruthy();
  });
  fireEvent.click(screen.getByRole('button', { name: 'Fixada (1)' }));
  fireEvent.click(screen.getByRole('menuitem', { name: /Trecho antigo/ }));
  await waitFor(() => expect(h.result.current.jumpTo?.messageId).toBe('m0'));
  expect(h.result.current.chat.messages).toHaveLength(65);
  expect(h.load).toHaveBeenCalledTimes(3);
});
it('404 oculta o botão; 401 pede nova sessão; vazio tem mensagem própria', async () => {
  let h = setup(404);
  await waitFor(() => expect(h.raw).toHaveBeenCalled());
  await waitFor(() => expect(h.result.current.actions).toBeUndefined());
  cleanup();
  h = setup(401);
  await waitFor(() => expect(h.result.current.actions?.props.error).toMatch(/Entre novamente/));
  cleanup();
  h = setup(200, []);
  await waitFor(() => expect(h.result.current.actions?.props.loading).toBe(false));
  render(h.result.current.actions, { wrapper: h.wrapper });
  fireEvent.click(screen.getByRole('button', { name: 'Fixada (0)' }));
  expect(screen.getByText('Nenhuma mensagem fixada nesta conversa.')).toBeTruthy();
});
it('mensagem removida e falha de paginação param a busca com aviso', async () => {
  const h = setup();
  await waitFor(() => expect(h.result.current.chat.loading).toBeNull());
  await act(() => h.result.current.actions!.props.onSelect('removida'));
  await waitFor(() => expect(h.result.current.actions?.props.error).toMatch(/Mensagem não encontrada/));
  expect(h.load).toHaveBeenCalledTimes(3);
});
