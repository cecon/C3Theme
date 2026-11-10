// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import type { Message } from '../core/types';
import MessageList, { type MessageListProps } from './MessageList';

// a lista é virtualizada: sem altura, o jsdom não mostra linha nenhuma. Janela de 600 px e linha de 60 px.
beforeAll(() => {
  Object.defineProperties(HTMLElement.prototype, {
    offsetHeight: { configurable: true, get: () => 600 },
    offsetWidth: { configurable: true, get: () => 400 },
    clientHeight: { configurable: true, get: () => 600 }
  });
  HTMLElement.prototype.scrollTo = function scrollTo() {};
});
afterEach(cleanup);

const theme = createTheme({ cssVariables: true });
const ana = { id: 'ana', name: 'Ana' };
const eu = { id: 'eu', name: 'Eu' };

const msg = (i: number, extra: Partial<Message> = {}): Message => ({
  id: `m${i}`,
  conversationId: 'c1',
  author: i % 2 ? ana : eu,
  direction: i % 2 ? 'in' : 'out',
  text: `mensagem ${i}`,
  createdAt: `2026-11-02T12:${String(i).padStart(2, '0')}:00.000Z`,
  ...extra
});

const list = (props: Partial<MessageListProps> = {}) => {
  const ui = (p: Partial<MessageListProps>) => (
    <ThemeProvider theme={theme}>
      <IntlProvider locale="pt-BR" onError={() => {}}>
        <div style={{ height: 600 }}>
          <MessageList title="Ana" messages={[]} {...props} {...p} />
        </div>
      </IntlProvider>
    </ThemeProvider>
  );
  const r = render(ui({}));
  return { ...r, update: (p: Partial<MessageListProps>) => r.rerender(ui(p)) };
};

describe('MessageList', () => {
  it('vazia: log com o nome da conversa e o aviso padrão, ou o vazio do app', () => {
    list();
    expect(screen.getByRole('log', { name: 'Mensagens de Ana' })).toBeTruthy();
    expect(screen.getByText('Nenhuma mensagem ainda')).toBeTruthy();
    cleanup();
    list({ empty: <p>Comece por aqui</p> });
    expect(screen.getByText('Comece por aqui')).toBeTruthy();
  });

  it('mostra as mensagens e marca o início quando não há histórico anterior', () => {
    list({ messages: [msg(1), msg(2), msg(3)] });
    expect(screen.getByText('mensagem 1')).toBeTruthy();
    expect(screen.getByText('mensagem 3')).toBeTruthy();
    expect(screen.getByText('Início da conversa')).toBeTruthy();
  });

  it('com histórico anterior: sem "Início da conversa", barra de carregando e pede mais quando a página não enche', () => {
    const onLoadOlder = vi.fn();
    const { update } = list({ messages: [msg(1)], hasMore: true, onLoadOlder });
    expect(screen.queryByText('Início da conversa')).toBeNull();
    // a página curta não tem rolagem: pede o histórico sozinha
    expect(onLoadOlder).toHaveBeenCalled();
    update({ loadingOlder: true });
    expect(screen.getByRole('progressbar', { name: 'Carregando mensagens anteriores…' })).toBeTruthy();
  });

  it('rolar perto do topo pede o histórico anterior', () => {
    const onLoadOlder = vi.fn();
    const messages = Array.from({ length: 30 }, (_, i) => msg(i + 1));
    list({ messages, hasMore: true, onLoadOlder });
    onLoadOlder.mockClear();
    const log = screen.getByRole('log');
    Object.defineProperty(log, 'scrollHeight', { configurable: true, value: 3000 });
    act(() => {
      log.scrollTop = 100;
      fireEvent.scroll(log);
    });
    expect(onLoadOlder).toHaveBeenCalledTimes(1);
  });

  it('chegou mensagem enquanto lia acima: botão "Novas mensagens" com a conta, que leva ao fim e some', () => {
    const messages = Array.from({ length: 30 }, (_, i) => msg(i + 1));
    const { update } = list({ messages });
    const log = screen.getByRole('log');
    // usuário subiu: longe do fim
    Object.defineProperty(log, 'scrollHeight', { configurable: true, value: 3000 });
    act(() => {
      log.scrollTop = 500;
      fireEvent.scroll(log);
    });
    update({ messages: [...messages, msg(31), msg(33)] });
    const button = screen.getByRole('button', { name: 'Novas mensagens (2)' });
    fireEvent.click(button);
    expect(screen.queryByRole('button', { name: /Novas mensagens/ })).toBeNull();
  });

  it('mensagem minha nova não conta como não vista (desce junto)', () => {
    const messages = Array.from({ length: 30 }, (_, i) => msg(i + 1));
    const { update } = list({ messages });
    const log = screen.getByRole('log');
    Object.defineProperty(log, 'scrollHeight', { configurable: true, value: 3000 });
    act(() => {
      log.scrollTop = 500;
      fireEvent.scroll(log);
    });
    update({ messages: [...messages, msg(32)] });
    expect(screen.queryByRole('button', { name: /Novas mensagens/ })).toBeNull();
  });

  it('quem está digitando aparece no pé', () => {
    list({ messages: [msg(1)], typing: [ana] });
    expect(screen.getByText('Ana está digitando…')).toBeTruthy();
  });

  it('assistente: resposta sem balão, com os autores e o estado do agente no último bloco', () => {
    const messages = [msg(2), msg(1, { format: 'markdown', text: '**pronto**' })];
    list({ messages, variant: 'assistant', showAuthors: true, agentStates: { ana: 'working' } });
    expect(screen.getByText('pronto').tagName).toBe('STRONG');
    expect(screen.getByText('· Trabalhando')).toBeTruthy();
    expect(screen.queryByText('Início da conversa')).toBeNull();
  });

  it('mensagem que falhou: Tentar de novo, Editar e Descartar só com o callback (#173)', () => {
    const failed = msg(2, { clientId: 'c2', status: 'failed' });
    const onRetry = vi.fn();
    const onEditFailed = vi.fn();
    const onDiscard = vi.fn();
    const { update } = list({ messages: [failed], onRetry });
    expect(screen.queryByRole('button', { name: 'Editar' })).toBeNull();
    update({ messages: [failed], onRetry, onEditFailed, onDiscard });
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Descartar' }));
    expect(onRetry).toHaveBeenCalledWith('c2');
    expect(onEditFailed).toHaveBeenCalledWith(failed);
    expect(onDiscard).toHaveBeenCalledWith(failed);
  });
});
