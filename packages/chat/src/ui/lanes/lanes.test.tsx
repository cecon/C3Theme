// @vitest-environment jsdom
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import type { Lane, MessageAction } from '../../core/lanes';
import type { Message } from '../../core/types';
import AssistantPanel, { type AssistantChat } from '../AssistantPanel';
import { message, wrap } from '../hitl/hitl.test-utils';
import MessageList from '../MessageList';
import LanePanel from './LanePanel';
import MessageActionsMenu from './MessageActionsMenu';

// lista virtualizada: sem altura, o jsdom não desenha linha nenhuma
beforeAll(() => {
  Object.defineProperties(HTMLElement.prototype, {
    offsetHeight: { configurable: true, get: () => 600 },
    offsetWidth: { configurable: true, get: () => 400 },
    clientHeight: { configurable: true, get: () => 600 }
  });
  HTMLElement.prototype.scrollTo = function scrollTo() {};
});
afterEach(cleanup);

const branch: MessageAction = { id: 'c3.branch', label: 'Ramificar daqui', when: { direction: 'in' }, opens: 'branch' };
const pin: MessageAction = { id: 'fixar', label: 'Fixar' };
const reply = (extra: Partial<Message> = {}): Message => ({ ...message, text: 'resposta', ...extra });
const mine = reply({ id: 'm2', direction: 'out', author: { id: 'eu', name: 'Eu' }, text: 'pergunta' });

const chatOf = (messages: Message[], extra: Partial<AssistantChat> = {}): AssistantChat => ({
  conversationId: 'c1',
  messages,
  hasMore: false,
  loading: null,
  loadOlder: vi.fn(),
  send: vi.fn(),
  retry: vi.fn(),
  stop: vi.fn(),
  generating: false,
  answer: vi.fn(),
  ...extra
});

const lane = (id: string, extra: Partial<Lane> = {}): Lane => ({
  id,
  title: `Conversa ${id}`,
  unread: 0,
  updatedAt: '2026-11-12T10:00:00Z',
  kind: 'aside',
  parentId: 'c1',
  ...extra
});

describe('MessageActionsMenu', () => {
  it('abre o menu e manda a ação escolhida com a mensagem', () => {
    const onAction = vi.fn();
    wrap(<MessageActionsMenu message={reply()} actions={[branch, pin]} onAction={onAction} />);
    const button = screen.getByRole('button', { name: 'Mais ações' });
    expect(button.getAttribute('aria-haspopup')).toBe('menu');
    expect(button.getAttribute('aria-expanded')).toBeNull();
    fireEvent.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('true');
    const menu = screen.getByRole('menu');
    expect(
      within(menu)
        .getAllByRole('menuitem')
        .map((i) => i.textContent)
    ).toEqual(['Ramificar daqui', 'Fixar']);
    fireEvent.click(within(menu).getByText('Ramificar daqui'));
    expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ id: 'm1' }), 'c3.branch');
  });

  it('sem ação que valha, ou sem onAction: nada', () => {
    const { container } = wrap(
      <>
        <MessageActionsMenu message={mine} actions={[branch]} onAction={vi.fn()} />
        <MessageActionsMenu message={reply()} actions={[branch]} />
        <MessageActionsMenu message={reply()} onAction={vi.fn()} />
      </>
    );
    expect(container.querySelector('button')).toBeNull();
  });
});

describe('MessageList com ações por mensagem', () => {
  it('assistente: o menu fica no rodapé da resposta, só nas que valem', () => {
    const onAction = vi.fn();
    wrap(
      <MessageList variant="assistant" title="Assistente" messages={[mine, reply()]} messageActions={[branch]} onMessageAction={onAction} />
    );
    const buttons = screen.getAllByRole('button', { name: 'Mais ações' });
    expect(buttons).toHaveLength(1);
    fireEvent.click(buttons[0]);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Ramificar daqui' }));
    expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ id: 'm1' }), 'c3.branch');
  });

  it('balão: a minha e a recebida ganham o botão quando a ação vale para as duas', () => {
    const onAction = vi.fn();
    wrap(<MessageList title="Ana" messages={[mine, reply()]} messageActions={[pin]} onMessageAction={onAction} />);
    const buttons = screen.getAllByRole('button', { name: 'Mais ações' });
    expect(buttons).toHaveLength(2);
    fireEvent.click(buttons[0]);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Fixar' }));
    expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ id: 'm2' }), 'fixar');
  });

  it('balão sem ação que valha: sem botão', () => {
    wrap(<MessageList title="Ana" messages={[mine]} messageActions={[branch]} onMessageAction={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Mais ações' })).toBeNull();
  });
});

describe('AssistantPanel', () => {
  it('"À parte" leva o texto escrito e limpa a caixa', () => {
    const onAside = vi.fn();
    wrap(<AssistantPanel chat={chatOf([reply()])} onAside={onAside} messageActions={[branch]} onMessageAction={vi.fn()} />);
    const box = screen.getByRole('textbox');
    fireEvent.change(box, { target: { value: '  quanto custa?  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'À parte' }));
    expect(onAside).toHaveBeenCalledWith('quanto custa?');
    expect((box as HTMLTextAreaElement).value).toBe('');
    expect(screen.getByRole('button', { name: 'Mais ações' })).toBeTruthy();
  });

  it('sem onAside, sem o botão', () => {
    wrap(<AssistantPanel chat={chatOf([])} />);
    expect(screen.queryByRole('button', { name: 'À parte' })).toBeNull();
  });
});

describe('LanePanel', () => {
  it('lista: trabalhando em cima, tipo e última frase, e abre ao clicar', () => {
    const onSelect = vi.fn();
    const onNewAside = vi.fn();
    const onClose = vi.fn();
    wrap(
      <LanePanel
        lanes={[
          lane('a', { lastMessage: { text: 'custa R$ 10', createdAt: 'x', direction: 'in', author: message.author } }),
          lane('b', { kind: 'branch', working: true, updatedAt: '2026-11-12T09:00:00Z' })
        ]}
        onSelect={onSelect}
        onBack={vi.fn()}
        onNewAside={onNewAside}
        onClose={onClose}
      />
    );
    expect(screen.getByRole('heading', { name: 'Conversas à parte' })).toBeTruthy();
    const items = within(screen.getByRole('list', { name: 'Conversas à parte' })).getAllByRole('button');
    expect(items[0].textContent).toContain('Conversa b');
    expect(items[0].textContent).toContain('Trabalhando');
    expect(items[0].textContent).toContain('Ramo');
    expect(items[1].textContent).toContain('À parte · custa R$ 10');
    fireEvent.click(items[1]);
    expect(onSelect).toHaveBeenCalledWith('a');
    fireEvent.click(screen.getByRole('button', { name: 'Nova conversa à parte' }));
    expect(onNewAside).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('vazia: explica como abrir; sem botões opcionais', () => {
    wrap(<LanePanel lanes={[]} onSelect={vi.fn()} onBack={vi.fn()} title="Lado" />);
    expect(screen.getByRole('heading', { name: 'Lado' })).toBeTruthy();
    expect(screen.getByText('Nenhuma conversa à parte')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('aberta: o assistente da conversa à parte, com voltar e o repasse ao painel', () => {
    const onBack = vi.fn();
    const onClose = vi.fn();
    const chat = chatOf([reply({ conversationId: 'a' })], { conversationId: 'a' });
    wrap(
      <LanePanel
        lanes={[lane('a')]}
        selectedId="a"
        chat={chat}
        onSelect={vi.fn()}
        onBack={onBack}
        onClose={onClose}
        panel={{ messageActions: [branch], onMessageAction: vi.fn() }}
      />
    );
    expect(screen.getByRole('heading', { name: 'Conversa a' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Mais ações' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Voltar às conversas à parte' }));
    expect(onBack).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('id aberto que não existe mais: volta para a lista', () => {
    wrap(<LanePanel lanes={[lane('a')]} selectedId="x" chat={chatOf([])} onSelect={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Conversas à parte' })).toBeTruthy();
  });
});
