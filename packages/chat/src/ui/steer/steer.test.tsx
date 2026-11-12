// @vitest-environment jsdom
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import type { Message } from '../../core/types';
import AgentComposer, { type AgentComposerProps } from '../AgentComposer';
import AssistantPanel, { type AssistantChat } from '../AssistantPanel';
import MessageBubble from '../MessageBubble';
import QueuedMessages from '../QueuedMessages';
import { message, wrap } from '../hitl/hitl.test-utils';
import NoticeBar from './NoticeBar';

beforeAll(() => {
  Object.defineProperties(HTMLElement.prototype, {
    offsetHeight: { configurable: true, get: () => 600 },
    offsetWidth: { configurable: true, get: () => 400 },
    clientHeight: { configurable: true, get: () => 600 }
  });
  HTMLElement.prototype.scrollTo = () => {};
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function Controlled(props: Omit<AgentComposerProps, 'value' | 'onChange'>) {
  const [value, setValue] = useState('');
  return <AgentComposer {...props} value={value} onChange={setValue} />;
}

const box = () => screen.getByRole('textbox', { name: 'Mensagem' });
const type = (text: string) => fireEvent.change(box(), { target: { value: text } });
const queueOf = (more = {}) => ({
  items: [{ id: 'q1', text: 'depois', files: [] }],
  enqueue: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  sendNow: vi.fn(),
  steer: vi.fn(),
  steerNext: vi.fn(),
  canSteer: true,
  pause: vi.fn(),
  ...more
});

describe('AgentComposer: orientar', () => {
  it('com turno, Ctrl+Enter (ou ⌘+Enter) orienta com o texto e limpa a caixa; o atalho aparece', () => {
    const onSteer = vi.fn();
    const onSend = vi.fn();
    wrap(<Controlled busy onSend={onSend} onSteer={onSteer} />);
    expect(screen.getByText('orienta o agente sem parar o trabalho')).toBeTruthy();
    type('  vá pelo norte  ');
    fireEvent.keyDown(box(), { key: 'Enter', ctrlKey: true });
    expect(onSteer).toHaveBeenCalledWith('vá pelo norte', []);
    expect((box() as HTMLTextAreaElement).value).toBe('');
    type('outra');
    fireEvent.keyDown(box(), { key: 'Enter', metaKey: true });
    expect(onSteer).toHaveBeenLastCalledWith('outra', []);
    expect(onSend).not.toHaveBeenCalled();
  });

  it('com a caixa vazia, Ctrl+Enter orienta com a primeira da fila; desligado, nada', () => {
    const queue = queueOf();
    const onSteer = vi.fn();
    const { unmount } = wrap(<Controlled busy onSend={vi.fn()} onSteer={onSteer} queue={queue} />);
    fireEvent.keyDown(box(), { key: 'Enter', ctrlKey: true });
    expect(queue.steerNext).toHaveBeenCalledTimes(1);
    expect(onSteer).not.toHaveBeenCalled();
    unmount();
    wrap(<Controlled busy disabled onSend={vi.fn()} onSteer={onSteer} queue={queue} />);
    fireEvent.keyDown(box(), { key: 'Enter', ctrlKey: true });
    expect(queue.steerNext).toHaveBeenCalledTimes(1);
  });

  it('sem turno, Ctrl+Enter envia e o atalho de orientar não aparece', () => {
    const onSend = vi.fn();
    wrap(<Controlled onSend={onSend} onSteer={vi.fn()} />);
    expect(screen.queryByText('orienta o agente sem parar o trabalho')).toBeNull();
    type('oi');
    fireEvent.keyDown(box(), { key: 'Enter', ctrlKey: true });
    expect(onSend).toHaveBeenCalledWith('oi', []);
  });

  it('modo Ctrl+Enter: Enter quebra a linha; Ctrl+Enter envia; ocupado, a dica fala do botão', () => {
    const onSend = vi.fn();
    const { unmount } = wrap(<Controlled variant="stacked" sendKey="modEnter" onSend={onSend} />);
    type('oi');
    fireEvent.keyDown(box(), { key: 'Enter' });
    expect(onSend).not.toHaveBeenCalled();
    fireEvent.keyDown(box(), { key: 'Enter', ctrlKey: true });
    expect(onSend).toHaveBeenCalledWith('oi', []);
    unmount();
    wrap(<Controlled variant="stacked" sendKey="modEnter" busy queue={queueOf({ items: [] })} onSend={onSend} />);
    expect(screen.getByText('O botão põe na fila · Esc para a resposta')).toBeTruthy();
  });

  it('a fila ganha Orientar com turno e mostra as orientações esperando', () => {
    const queue = queueOf();
    const steering: Message[] = [{ ...message, id: 's1', direction: 'out', text: 'vá pelo norte', steer: 'pending' }];
    const onRemoveSteering = vi.fn();
    wrap(<Controlled busy onSend={vi.fn()} queue={queue} steering={steering} onRemoveSteering={onRemoveSteering} />);
    fireEvent.click(screen.getByRole('button', { name: 'Orientar' }));
    expect(queue.steer).toHaveBeenCalledWith('q1');
    expect(screen.getByText('Orientando')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Enviar agora' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Remover orientação' }));
    expect(onRemoveSteering).toHaveBeenCalledWith('s1');
  });
});

describe('QueuedMessages', () => {
  it('orientação sem remover só mostra o estado; vazia não desenha nada', () => {
    const steering: Message[] = [{ ...message, id: 's1', direction: 'out', text: 'vá', steer: 'pending' }];
    const { container, unmount } = wrap(<QueuedMessages items={[]} onUpdate={vi.fn()} onRemove={vi.fn()} steering={steering} />);
    expect(screen.getByText('Orientando')).toBeTruthy();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    unmount();
    wrap(<QueuedMessages items={[]} onUpdate={vi.fn()} onRemove={vi.fn()} />);
    expect(container.querySelector('ul')).toBeNull();
  });
});

describe('NoticeBar', () => {
  it('mostra o texto do sistema, fecha no X e sai sozinho depois do prazo', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    const notice = { seq: 1, text: 'O agente vai parar e responder.', tone: 'warning' as const };
    const { unmount } = wrap(<NoticeBar notice={notice} onDismiss={onDismiss} duration={1000} />);
    expect(screen.getByRole('status').textContent).toContain('O agente vai parar e responder.');
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(999));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(1));
    expect(onDismiss).toHaveBeenCalledTimes(2);
    unmount();
    wrap(<NoticeBar notice={null} onDismiss={onDismiss} />);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('o prazo padrão é de 8 s', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    wrap(<NoticeBar notice={{ seq: 1, text: 'x', tone: 'info' }} onDismiss={onDismiss} />);
    act(() => vi.advanceTimersByTime(7999));
    expect(onDismiss).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});

describe('MessageBubble', () => {
  it('a orientação lida leva a marca "Orientou"', () => {
    wrap(<MessageBubble message={{ ...message, direction: 'out', text: 'vá', steer: 'taken' }} />);
    expect(screen.getByText(/Orientou/)).toBeTruthy();
  });
});

const busyReply: Message = { ...message, id: 'r1', text: 'Trabalhando…', streaming: true };
const chatOf = (messages: Message[], more: Partial<AssistantChat> = {}): AssistantChat => ({
  conversationId: 'c1',
  messages,
  hasMore: false,
  loading: null,
  loadOlder: vi.fn(),
  send: vi.fn(),
  retry: vi.fn(),
  stop: vi.fn(),
  generating: true,
  answer: vi.fn(),
  ...more
});

describe('AssistantPanel: orientar', () => {
  it('Ctrl+Enter manda com steer; a orientação esperando vai para a fila, não para a conversa', () => {
    const pending: Message = {
      ...message,
      id: 's1',
      direction: 'out',
      text: 'vá pelo norte',
      steer: 'pending',
      createdAt: '2026-11-12T10:05:00Z'
    };
    const chat = chatOf([busyReply, pending], { remove: vi.fn().mockResolvedValue(undefined) });
    wrap(<AssistantPanel chat={chat} steer />);
    type('mais detalhes');
    fireEvent.keyDown(box(), { key: 'Enter', ctrlKey: true });
    expect(chat.send).toHaveBeenCalledWith('mais detalhes', { files: [], steer: true });
    const queue = screen.getByRole('list', { name: 'Mensagens na fila' });
    expect(queue.textContent).toContain('vá pelo norte');
    fireEvent.click(screen.getByRole('button', { name: 'Remover orientação' }));
    expect(chat.remove).toHaveBeenCalledWith('s1');
  });

  it('a fila orienta pelo send com steer; sem steer ligado, nada de Orientar', () => {
    const chat = chatOf([busyReply]);
    const { unmount } = wrap(<AssistantPanel chat={chat} steer />);
    type('depois');
    fireEvent.keyDown(box(), { key: 'Enter' });
    fireEvent.click(screen.getByRole('button', { name: 'Orientar' }));
    expect(chat.send).toHaveBeenCalledWith('depois', { files: [], steer: true });
    unmount();
    wrap(<AssistantPanel chat={chatOf([busyReply])} />);
    type('depois');
    fireEvent.keyDown(box(), { key: 'Enter' });
    expect(screen.queryByRole('button', { name: 'Orientar' })).toBeNull();
    expect(screen.queryByText('orienta o agente sem parar o trabalho')).toBeNull();
  });

  it('mostra o aviso passageiro e a dica do modo Ctrl+Enter', () => {
    const dismissNotice = vi.fn();
    const chat = chatOf([message], { generating: false, notice: { seq: 1, text: 'Não deu para orientar.', tone: 'info' }, dismissNotice });
    wrap(<AssistantPanel chat={chat} composer={{ variant: 'stacked', sendKey: 'modEnter' }} />);
    expect(screen.getByText('Não deu para orientar.')).toBeTruthy();
    expect(screen.getByText(/envia · Enter quebra a linha/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(dismissNotice).toHaveBeenCalled();
  });
});
