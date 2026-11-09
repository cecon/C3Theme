// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AgentEvent } from '../core/agentPanel';
import AgentNowCard from './AgentNowCard';
import AgentTimeline from './AgentTimeline';
import ContextMeter from './ContextMeter';
import RecentFiles from './RecentFiles';

afterEach(cleanup);

const theme = createTheme({ cssVariables: true });
// sem as mensagens carregadas, o react-intl reclama de cada chave (e o erro serializado estoura a memória do vitest)
const wrap = (ui: ReactNode) =>
  render(
    <ThemeProvider theme={theme}>
      <IntlProvider locale="pt-BR" onError={() => {}}>
        {ui}
      </IntlProvider>
    </ThemeProvider>
  );

const today = new Date();
const at = (h: number, m: number) => new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m).toISOString();

describe('painel do agente', () => {
  it('cartão: rótulo, texto e ação', () => {
    wrap(
      <AgentNowCard label="Esperando" tone="waiting" action={<button type="button">Responder</button>}>
        Marina confirmar o pedido
      </AgentNowCard>
    );
    expect(screen.getByText('Esperando')).toBeTruthy();
    expect(screen.getByText('Marina confirmar o pedido')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Responder' })).toBeTruthy();
  });

  it('medidor: valor e texto com o limite do resumo', () => {
    wrap(<ContextMeter used={62} summarizeAt={85} />);
    const meter = screen.getByRole('meter', { name: 'Contexto' });
    expect(meter.getAttribute('aria-valuenow')).toBe('62');
    expect(screen.getByText('62% usado. Resumo automático em 85%.')).toBeTruthy();
  });

  it('medidor sem limite: só a porcentagem', () => {
    wrap(<ContextMeter used={140} />);
    expect(screen.getByText('100% usado.')).toBeTruthy();
  });

  it('linha do tempo: horário, clique abre o evento e erro dito ao leitor de tela', () => {
    const onOpen = vi.fn();
    const events: AgentEvent[] = [
      { id: 'e2', at: at(10, 43), kind: 'error', text: 'Frete fora do ar' },
      { id: 'e1', at: at(10, 41), kind: 'received', text: 'Recebeu pedido pelo WhatsApp' }
    ];
    wrap(<AgentTimeline events={events} onOpen={onOpen} />);
    expect(screen.getByRole('region', { name: 'O que fez' })).toBeTruthy();
    expect(screen.getByText('10:43').getAttribute('datetime')).toBe(events[0].at);
    fireEvent.click(screen.getByRole('button', { name: /WhatsApp/ }));
    expect(onOpen).toHaveBeenCalledWith('e1');
    expect(screen.getByRole('button', { name: /Erro: Frete fora do ar/ }).textContent).toContain('10:43');
  });

  it('linha do tempo: carregar mais e vazio', () => {
    const onLoadMore = vi.fn();
    const { rerender } = wrap(<AgentTimeline events={[]} hasMore onLoadMore={onLoadMore} />);
    expect(screen.getByText('Nada feito ainda.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Carregar mais' }));
    expect(onLoadMore).toHaveBeenCalled();
    rerender(
      <ThemeProvider theme={theme}>
        <IntlProvider locale="pt-BR" onError={() => {}}>
          <AgentTimeline events={[]} hasMore loadingMore onLoadMore={onLoadMore} />
        </IntlProvider>
      </ThemeProvider>
    );
    expect((screen.getByRole('button', { name: 'Carregando…' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('nível do título vem do app', () => {
    wrap(<RecentFiles files={[]} headingComponent="h2" />);
    expect(screen.getByRole('heading', { level: 2, name: 'Arquivos recentes' })).toBeTruthy();
  });

  it('arquivos: nome, tamanho e abrir', () => {
    const onOpen = vi.fn();
    wrap(<RecentFiles files={[{ id: 'f1', name: 'cardapio-novembro.pdf', size: 212 * 1024 }]} onOpen={onOpen} />);
    fireEvent.click(screen.getByRole('button', { name: /cardapio-novembro\.pdf.*212 KB/ }));
    expect(onOpen).toHaveBeenCalledWith('f1');
  });
});
