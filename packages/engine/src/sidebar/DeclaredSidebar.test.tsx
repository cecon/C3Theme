// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router';
import { C3ThemeProvider } from '@c3theme/ui';
import { EngineProvider, type EngineState } from '../context';
import DeclaredSidebar from './DeclaredSidebar';
import type { SidebarDef, SidebarPort, SidebarSnapshot } from './types';

afterEach(() => {
  cleanup();
  localStorage.clear();
});
const def: SidebarDef = {
  source: 'equipe',
  label: 'Conversas',
  title: 'Agentes',
  sections: [{ id: 'team', label: 'Time' }],
  cards: [{ id: 'machine', label: 'Máquina', action: { id: 'open', label: 'Abrir máquina' } }]
};
function Route() {
  return <output aria-label="Destino">{useLocation().pathname}</output>;
}
const state = (port?: SidebarPort): EngineState => ({
  app: { name: 'App', entities: [], layout: { menu: [] } },
  entities: {},
  components: {},
  client: {} as EngineState['client'],
  sidebars: port ? { equipe: port } : undefined,
  icons: { User: () => <span aria-label="Marca visual">U</span> }
});
const show = (port?: SidebarPort, onNavigate = vi.fn()) =>
  render(
    <C3ThemeProvider>
      <MemoryRouter>
        <EngineProvider value={state(port)}>
          <DeclaredSidebar def={def} onNavigate={onNavigate} />
          <Route />
        </EngineProvider>
      </MemoryRouter>
    </C3ThemeProvider>
  );
it('fonte declarada ausente mostra erro acessível em vez de uma lista muda', () => {
  show();
  expect(screen.getByRole('alert').textContent).toContain('equipe');
});
it('spec traduzida monta a lista, atualiza por porta, navega e limpa assinatura', () => {
  let snapshot: SidebarSnapshot = {
    serverId: 'A',
    items: [
      {
        id: 'ana',
        label: { id: 'person', defaultMessage: 'Ana' },
        icon: 'User',
        status: 'Aguardando',
        section: 'team',
        path: '/ana',
        actions: [{ id: 'duplicate', label: 'Duplicar' }]
      }
    ],
    cards: [{ id: 'machine', severity: 'ok', message: 'Online' }],
    sections: [
      { id: 'team', label: 'Duplicada ignorada' },
      { id: 'new', label: 'Nova' }
    ],
    views: [
      { id: 'a', label: 'Agentes' },
      { id: 'r', label: 'Rotinas' }
    ]
  };
  let listener = () => {};
  const dispose = vi.fn(),
    select = vi.fn(),
    onNavigate = vi.fn();
  const port: SidebarPort = {
    getSnapshot: () => snapshot,
    subscribe: (fn) => {
      listener = fn;
      return dispose;
    },
    select,
    setView: vi.fn(),
    cardAction: vi.fn(),
    retry: vi.fn()
  };
  const rendered = show(port, onNavigate);
  expect(screen.getByLabelText('Marca visual')).toBeTruthy();
  expect(screen.getByText('Online')).toBeTruthy();
  expect(screen.getByRole('button', { name: /Nova \(0\)/ })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Ana Aguardando' }));
  expect(select).toHaveBeenCalledWith('ana');
  expect(onNavigate).toHaveBeenCalledOnce();
  expect(screen.getByLabelText('Destino').textContent).toBe('/ana');
  fireEvent.click(screen.getByRole('button', { name: 'Abrir máquina' }));
  act(() => {
    snapshot = { ...snapshot, serverId: 'B', items: [{ id: 'bia', label: 'Bia', section: 'unknown' }] };
    listener();
  });
  expect(screen.queryByRole('button', { name: 'Ana Aguardando' })).toBeNull();
  expect(screen.getByRole('button', { name: 'Bia' })).toBeTruthy();
  act(() => {
    snapshot = { ...snapshot, error: 'Conexão interrompida' };
    listener();
  });
  fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
  expect(port.retry).toHaveBeenCalledOnce();
  rendered.unmount();
  expect(dispose).toHaveBeenCalledOnce();
});
