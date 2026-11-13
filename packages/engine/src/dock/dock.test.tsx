// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { IntlProvider } from 'react-intl';
import { MemoryRouter, useLocation } from 'react-router';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { EngineProvider } from '../context';
import type { EngineState } from '../context';
import { ShellDockFrame } from './ShellAgentDock';
import type { AgentDockDef, AgentDockPort, AgentDockSnapshot } from './types';

afterEach(cleanup);
const agent = { id: 'a', label: 'Design', status: 'idle' as const, path: '/chat/a' };
const def: AgentDockDef = {
  source: 'agents',
  position: 'bottom',
  size: 84,
  label: 'Agentes ativos',
  states: { empty: { message: 'Sem agentes na equipe', action: { label: 'Criar agente', path: '/novo' } } }
};
function fixture(initial: AgentDockSnapshot = { items: [agent] }) {
  let snapshot = initial;
  const listeners = new Set<() => void>();
  const unsubscribe = vi.fn();
  const port: AgentDockPort = {
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        unsubscribe();
        listeners.delete(listener);
      };
    },
    retry: vi.fn()
  };
  return {
    port,
    unsubscribe,
    publish(next: AgentDockSnapshot) {
      snapshot = next;
      act(() => listeners.forEach((listener) => listener()));
    }
  };
}
function Location() {
  return <p data-testid="location">{useLocation().pathname}</p>;
}
function mount(port?: AgentDockPort, declared: AgentDockDef | undefined = def) {
  const state = {
    app: { layout: { agentDock: declared } },
    agentDocks: port && { agents: port },
    connectivity: { getOnline: () => true, subscribe: () => () => {} }
  } as unknown as EngineState;
  return render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <IntlProvider locale="pt-BR">
        <MemoryRouter>
          <EngineProvider value={state}>
            <ShellDockFrame>
              <input aria-label="Rascunho" defaultValue="Texto preservado" />
              <Location />
            </ShellDockFrame>
          </EngineProvider>
        </MemoryRouter>
      </IntlProvider>
    </ThemeProvider>
  );
}
it('porta atualiza estados e anuncia aprovações sem remontar página; seleciona destino e limpa inscrição', () => {
  const f = fixture();
  const view = mount(f.port);
  fireEvent.change(screen.getByLabelText('Rascunho'), { target: { value: 'Meu texto' } });
  f.publish({ items: [{ ...agent, status: 'waiting-approval', approvals: 2 }] });
  expect(screen.getByRole('button', { name: 'Design · Aguardando aprovação · 2 aprovações' })).toBeTruthy();
  expect(screen.getAllByRole('status').some((element) => element.textContent?.includes('2 aprovações'))).toBe(true);
  expect((screen.getByLabelText('Rascunho') as HTMLInputElement).value).toBe('Meu texto');
  fireEvent.click(screen.getByRole('button', { name: /Design ·/ }));
  expect(screen.getByTestId('location').textContent).toBe('/chat/a');
  view.unmount();
  expect(f.unsubscribe).toHaveBeenCalledOnce();
});
it('carregando, vazio com ação, erro e nova tentativa com rejeição tratada', async () => {
  const f = fixture({ items: [], loading: true });
  mount(f.port);
  expect(screen.getByText('Carregando agentes…')).toBeTruthy();
  f.publish({ items: [] });
  fireEvent.click(screen.getByRole('button', { name: 'Criar agente' }));
  expect(screen.getByTestId('location').textContent).toBe('/novo');
  f.publish({ items: [], error: true });
  vi.mocked(f.port.retry).mockRejectedValueOnce(new Error('falhou'));
  fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
  await waitFor(() => expect(f.port.retry).toHaveBeenCalledOnce());
  expect(screen.getByRole('alert').textContent).toContain('Não foi possível');
});
it('offline conserva último snapshot mesmo quando porta não envia os itens', () => {
  const f = fixture();
  mount(f.port);
  f.publish({ items: [], offline: true, error: true });
  expect(screen.getByText('Sem conexão · último estado conhecido')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Design · Ocioso' })).toBeTruthy();
  expect(screen.queryByRole('alert')).toBeNull();
});
it('opt-in: sem declaração não reserva área, fonte ausente explica erro', () => {
  const view = mount(undefined);
  expect(screen.getByRole('alert')).toBeTruthy();
  view.unmount();
  render(
    <IntlProvider locale="pt-BR">
      <EngineProvider value={{ app: { layout: {} } } as EngineState}>
        <ShellDockFrame>
          <span>Página sem dock</span>
        </ShellDockFrame>
      </EngineProvider>
    </IntlProvider>
  );
  expect(screen.getByText('Página sem dock')).toBeTruthy();
  expect(document.querySelector('[data-agent-dock-frame]')).toBeNull();
});
it('fonte herdada não vira uma porta de dados', () => {
  const f = fixture();
  mount(f.port, { ...def, source: '__proto__' });
  expect(screen.getByRole('alert')).toBeTruthy();
  expect(screen.queryByRole('button', { name: /Design/ })).toBeNull();
});
