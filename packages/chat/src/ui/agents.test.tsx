// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AgentRequest } from '../core/agents';
import type { Message } from '../core/types';
import AgentDock, { type DockAgent } from './agents/AgentDock';
import AgentStrip from './agents/AgentStrip';

afterEach(cleanup);

const theme = createTheme({ cssVariables: true });
const wrap = (ui: ReactNode) =>
  render(
    <ThemeProvider theme={theme}>
      <IntlProvider locale="pt-BR" onError={() => {}}>
        {ui}
      </IntlProvider>
    </ThemeProvider>
  );

const agents: DockAgent[] = [
  { id: 'at', name: 'Atendente', state: 'waiting', avatar: <span>A</span>, pending: 1 },
  { id: 'fi', name: 'Financeiro', state: 'working', avatar: <span>F</span> }
];
const messages: Message[] = [
  {
    id: 'm1',
    conversationId: 'c',
    author: { id: 'at', name: 'Atendente' },
    direction: 'in',
    text: 'Posso mandar o boleto?',
    createdAt: '2026-11-08T13:00:00Z'
  }
];

describe('AgentDock', () => {
  it('cada item diz nome, estado e pendências', () => {
    wrap(<AgentDock agents={agents} />);
    expect(screen.getByRole('button', { name: 'Atendente: Esperando você, 1 pendente' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Financeiro: Trabalhando' })).toBeTruthy();
  });

  it('clicar abre o balão com as mensagens; responder e abrir a conversa chamam o app', () => {
    const onReply = vi.fn();
    const onOpenConversation = vi.fn();
    wrap(<AgentDock agents={agents} messagesOf={() => messages} onReply={onReply} onOpenConversation={onOpenConversation} />);
    const item = screen.getByRole('button', { name: /Atendente/ });
    fireEvent.click(item);
    expect(item.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('dialog', { name: 'Atendente' }).textContent).toContain('Posso mandar o boleto?');
    fireEvent.change(screen.getByRole('textbox', { name: 'Responder a Atendente' }), { target: { value: 'Pode' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar mensagem' }));
    expect(onReply).toHaveBeenCalledWith('at', 'Pode');
    fireEvent.click(screen.getByRole('button', { name: 'Abrir conversa' }));
    expect(onOpenConversation).toHaveBeenCalledWith('at');
  });

  it('Esc fecha o balão', () => {
    wrap(<AgentDock agents={agents} messagesOf={() => messages} />);
    fireEvent.click(screen.getByRole('button', { name: /Atendente/ }));
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

const base = { agentId: 'at', agentName: 'Atendente' };
const requests: AgentRequest[] = [
  { ...base, id: 'p', kind: 'progress', text: 'Importando 120 pedidos', progress: 0.5 },
  { ...base, id: 'a', kind: 'approval', text: 'Enviar 3 lembretes por e-mail?' },
  { ...base, id: 'q', kind: 'question', text: 'Qual o prazo?' },
  { ...base, id: 'f', kind: 'failure', text: 'O servidor de e-mail recusou.' }
];

describe('AgentStrip', () => {
  it('recolhida mostra a atividade e a contagem; abre a pilha pelo botão', () => {
    wrap(
      <AgentStrip
        latest={{ name: 'Atendente', avatar: <span />, state: 'talking', activity: 'Atendente respondendo a Marina' }}
        requests={requests}
      />
    );
    const bar = screen.getByRole('button', { name: /Atendente respondendo a Marina/ });
    expect(bar.textContent).toContain('3 pendentes');
    expect(screen.queryByRole('article')).toBeNull();
    fireEvent.click(bar);
    expect(screen.getAllByRole('article').map((a) => a.getAttribute('aria-label'))).toEqual([
      'Atendente: Pede aprovação',
      'Atendente: Pergunta',
      'Atendente: Falhou',
      'Atendente: Trabalhando'
    ]);
  });

  it('cada cartão repassa o clique para o app, sem rede', () => {
    const on = { onApprove: vi.fn(), onDecline: vi.fn(), onAnswer: vi.fn(), onStop: vi.fn(), onOpen: vi.fn(), onDismiss: vi.fn() };
    wrap(<AgentStrip requests={requests} defaultExpanded {...on} />);
    fireEvent.click(screen.getByRole('button', { name: 'Permitir uma vez' }));
    expect(on.onApprove).toHaveBeenCalledWith(requests[1], 'once');
    fireEvent.click(screen.getByRole('button', { name: 'Sempre permitir' }));
    expect(on.onApprove).toHaveBeenLastCalledWith(requests[1], 'always');
    fireEvent.click(screen.getByRole('button', { name: 'Recusar' }));
    expect(on.onDecline).toHaveBeenCalledWith(requests[1]);
    fireEvent.change(screen.getByRole('textbox', { name: 'Sua resposta' }), { target: { value: 'Sexta' } });
    fireEvent.click(screen.getByRole('button', { name: 'Responder' }));
    expect(on.onAnswer).toHaveBeenCalledWith(requests[2], 'Sexta');
    fireEvent.click(screen.getByRole('button', { name: 'Parar' }));
    expect(on.onStop).toHaveBeenCalledWith(requests[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Dispensar' }));
    expect(on.onDismiss).toHaveBeenCalledWith(requests[3]);
    fireEvent.click(screen.getAllByRole('button', { name: 'Abrir conversa' })[0]);
    expect(on.onOpen).toHaveBeenCalledWith(requests[1]);
  });

  it('sem pedidos, aberta diz que não há nada', () => {
    wrap(<AgentStrip requests={[]} defaultExpanded />);
    expect(screen.getByText('Nenhum pedido agora')).toBeTruthy();
    expect(screen.getByRole('button', { expanded: true }).textContent).toContain('nada pendente');
  });
});
