// @vitest-environment jsdom
// O assistente pela spec (#71): sem chat no backend avisa, com chat mostra o título, as sugestões e a caixa da spec, e
// só desenha as partes de `parts`. O botão do header abre a gaveta; a página ocupa a tela.
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { memoryTransport, type ChatTransport, type Message } from '@c3theme/chat';

import { ApiError } from '../apiError';
import type { C3Client } from '../api';
import { EngineProvider } from '../context';
import { createMemoryClient } from '../memory/memoryClient';
import AssistantButton from './AssistantButton';
import ChatPage from './ChatPage';
import ChatPanel, { watchMissing } from './ChatPanel';
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

const bot = { id: 'bot', name: 'Assistente', kind: 'agent' as const };
const reply = (ui: Message['ui']): Message => ({
  id: 'r1',
  conversationId: 'assistant',
  author: bot,
  direction: 'in',
  text: 'Veja:',
  ui,
  createdAt: '2026-11-12T12:00:00Z'
});

function mount(node: React.ReactNode, chat?: ChatTransport) {
  const client: C3Client = createMemoryClient({ app: { name: 'x' } as never, entities: [], chat });
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <IntlProvider locale="pt-BR" onError={() => {}}>
        <EngineProvider value={{ client, app: { name: 'x' } as never, entities: {}, components: {} }}>{node}</EngineProvider>
      </IntlProvider>
    </ThemeProvider>
  );
}

const def: ChatDef = { title: 'Ajuda', suggestions: ['Quanto vendi hoje?'], placeholder: 'Pergunte ao assistente' };

describe('ChatPanel', () => {
  it('o resumo de entrega da spec marca a última resposta; o turno pode ter uma entrega própria', async () => {
    const t = memoryTransport([reply(undefined)]);
    mount(<ChatPanel def={{ entregaDaUltimaMensagem: { situacao: 'falhou', motivo: 'Canal desconectado' } }} />, t.transport);
    expect(await screen.findByText('Falhou: Canal desconectado')).toBeTruthy();
  });

  it('sem transporte de chat, avisa que o sistema não tem assistente', () => {
    mount(<ChatPanel def={def} />);
    expect(screen.getByText('Este sistema não tem assistente.')).toBeTruthy();
  });

  it('backend sem a porta (404 ao abrir) também avisa', async () => {
    const t = memoryTransport();
    const missing: ChatTransport = { ...t.transport, loadMessages: () => Promise.reject(new ApiError(404, 'not_found', 'Sem chat.')) };
    mount(<ChatPanel def={def} />, missing);
    expect(await screen.findByText('Este sistema não tem assistente.')).toBeTruthy();
  });

  it('mostra o título, as sugestões e o placeholder da spec; a sugestão envia', async () => {
    const t = memoryTransport();
    mount(<ChatPanel def={def} />, t.transport);
    expect(await screen.findByText('Ajuda')).toBeTruthy();
    expect(screen.getByPlaceholderText('Pergunte ao assistente')).toBeTruthy();
    fireEvent.click(screen.getByText('Quanto vendi hoje?'));
    expect(await screen.findByText('Quanto vendi hoje?')).toBeTruthy();
  });

  it('parte fora de `parts` aparece como "não sei mostrar", até as de humano no circuito', async () => {
    const plan = { id: 'p1', kind: 'c3.plan', payload: { steps: [{ id: 's1', text: 'Ler' }] } };
    const t = memoryTransport([reply([plan])]);
    mount(<ChatPanel def={{ parts: ['c3.form'] }} />, t.transport);
    expect(await screen.findByText('Veja:')).toBeTruthy();
    expect(screen.getByText('Esta resposta traz um conteúdo que esta tela não sabe mostrar.')).toBeTruthy();
    expect(screen.queryByText('Ler')).toBeNull();
  });

  it('steer e sendKey da spec: Ctrl+Enter com o agente ocupado orienta e a orientação espera na fila', async () => {
    const working = { ...reply(undefined), id: 'r0', text: 'Trabalhando', streaming: true };
    const t = memoryTransport([working]);
    mount(<ChatPanel def={{ steer: true, sendKey: 'modEnter' }} />, t.transport);
    expect(await screen.findByText('orienta o agente sem parar o trabalho')).toBeTruthy();
    const box = screen.getByRole('textbox', { name: 'Mensagem' });
    fireEvent.change(box, { target: { value: 'vá pelo norte' } });
    fireEvent.keyDown(box, { key: 'Enter' });
    expect((box as HTMLTextAreaElement).value).toBe('vá pelo norte');
    fireEvent.keyDown(box, { key: 'Enter', ctrlKey: true });
    const queue = await screen.findByRole('list', { name: 'Mensagens na fila' });
    expect(await within(queue).findByText('Orientando')).toBeTruthy();
    fireEvent.click(within(queue).getByRole('button', { name: 'Remover orientação' }));
    await vi.waitFor(() => expect(screen.queryByText('Orientando')).toBeNull());
  });

  it('watchMissing só avisa no 404', async () => {
    const calls: string[] = [];
    const fail = (status: number): ChatTransport => ({
      ...memoryTransport().transport,
      loadMessages: () => Promise.reject(new ApiError(status, 'x', 'x'))
    });
    await expect(watchMissing(fail(500), () => calls.push('500')).loadMessages('a', { limit: 1 })).rejects.toThrow();
    await expect(watchMissing(fail(404), () => calls.push('404')).loadMessages('a', { limit: 1 })).rejects.toThrow();
    expect(calls).toEqual(['404']);
  });
});

describe('AssistantButton e ChatPage', () => {
  it('o botão do header abre a gaveta com o painel e fecha pelo X', async () => {
    mount(<AssistantButton def={def} />, memoryTransport().transport);
    const button = screen.getByRole('button', { name: 'Ajuda' });
    expect(button.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('true');
    const drawer = await screen.findByRole('presentation');
    expect(await within(drawer).findByText('Quanto vendi hoje?')).toBeTruthy();
    fireEvent.click(within(drawer).getByRole('button', { name: /fechar/i }));
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('a página mostra o painel com o padrão (true)', async () => {
    mount(<ChatPage def={{}} />, memoryTransport().transport);
    expect(await screen.findByText('Assistente')).toBeTruthy();
    expect(screen.getByText('Como posso ajudar?')).toBeTruthy();
  });
});
