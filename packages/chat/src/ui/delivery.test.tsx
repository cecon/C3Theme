// @vitest-environment jsdom
import { act, cleanup, render, screen, within } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

import type { Message, MessageDelivery, ChatEvent, ChatTransport } from '../core';
import useMessageWindow from '../hooks/useMessageWindow';
import AssistantMessage from './AssistantMessage';
import MessageList from './MessageList';

afterEach(cleanup);
beforeAll(() => {
  Object.defineProperties(HTMLElement.prototype, {
    offsetHeight: { configurable: true, get: () => 600 },
    offsetWidth: { configurable: true, get: () => 400 },
    clientHeight: { configurable: true, get: () => 600 }
  });
  HTMLElement.prototype.scrollTo = function scrollTo() {};
});
const message = (id: string, extra: Partial<Message> = {}): Message => ({
  id,
  conversationId: 'c',
  text: `Resposta ${id}`,
  author: { id: 'agent', name: 'Agente', kind: 'agent' },
  direction: 'in',
  createdAt: '2026-11-12T12:00:00Z',
  ...extra
});
const frame = (ui: ReactNode) => (
  <ThemeProvider theme={createTheme({ cssVariables: true })}>
    <IntlProvider locale="pt-BR" onError={() => {}}>
      {ui}
    </IntlProvider>
  </ThemeProvider>
);

describe('marca de entrega externa', () => {
  it.each<MessageDelivery['situacao']>(['enviada', 'entregue', 'lida', 'falhou'])('mostra %s com texto acessível', (situacao) => {
    render(frame(<AssistantMessage message={message('1', { entrega: { situacao } })} />));
    const labels = { enviada: 'Enviada', entregue: 'Entregue', lida: 'Lida', falhou: 'Falhou' };
    expect(screen.getByRole('status').textContent).toBe(labels[situacao]);
  });

  it('sem entrega não confunde status de envio do chat com entrega externa', () => {
    render(frame(<AssistantMessage message={message('1', { status: 'read' })} />));
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('falha com motivo nulo mostra o estado sem inventar um motivo', () => {
    render(frame(<AssistantMessage message={message('1', { entrega: { situacao: 'falhou', motivo: null } })} />));
    expect(screen.getByRole('status').textContent).toBe('Falhou');
  });

  it('o resumo marca só a última resposta do agente e a entrega do turno prevalece', () => {
    const messages = [message('old'), message('last'), message('human', { direction: 'out' })];
    const ui = (entregaDaUltimaMensagem: MessageDelivery, messages_: Message[] = messages) =>
      frame(
        <div style={{ height: 600 }}>
          <MessageList title="Teste" variant="assistant" messages={messages_} entregaDaUltimaMensagem={entregaDaUltimaMensagem} />
        </div>
      );
    const view = render(ui({ situacao: 'falhou', motivo: 'WhatsApp desconectado' }));
    expect(screen.getByRole('status').textContent).toBe('Falhou: WhatsApp desconectado');
    expect(within(screen.getByText('Resposta old').parentElement!.parentElement!).queryByRole('status')).toBeNull();
    view.rerender(ui({ situacao: 'enviada' }, [messages[0], { ...messages[1], entrega: { situacao: 'lida' } }, messages[2]]));
    expect(screen.getByRole('status').textContent).toBe('Lida');
  });

  it('evento message atualiza a marca e o motivo da falha sem duplicar a mensagem', async () => {
    let emit: (event: ChatEvent) => void = () => {};
    const initial = message('event', { entrega: { situacao: 'enviada' } });
    const transport: ChatTransport = {
      loadMessages: async () => ({ messages: [initial], hasMore: false }),
      send: vi.fn(async () => initial),
      subscribe: (_id, listener) => {
        emit = listener;
        return () => {};
      }
    };
    function Live() {
      const chat = useMessageWindow(transport, 'c', { me: { id: 'me', name: 'Eu' } });
      return (
        <>
          {chat.messages.map((m) => (
            <AssistantMessage key={m.id} message={m} />
          ))}
        </>
      );
    }
    render(frame(<Live />));
    expect(await screen.findByText('Enviada')).toBeTruthy();
    act(() => emit({ type: 'message', message: { ...initial, entrega: { situacao: 'entregue' } } }));
    expect(screen.getByRole('status').textContent).toBe('Entregue');
    act(() => emit({ type: 'message', message: { ...initial, entrega: { situacao: 'falhou', motivo: '<Destino indisponível>' } } }));
    expect(screen.getByRole('status').textContent).toBe('Falhou: <Destino indisponível>');
    expect(screen.getAllByText('Resposta event')).toHaveLength(1);
  });
});
