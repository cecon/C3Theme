// @vitest-environment jsdom
// #96: theme.defaultMode atravessa a shell tanto na página quanto antes do login.
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { useColorScheme } from '@mui/material/styles';
import C3Shell from './C3Shell';
import type { AuthPort } from './auth/port';

beforeEach(() => {
  vi.stubGlobal('matchMedia', (query: string) => ({
    media: query,
    matches: false,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }));
  window.scrollTo = vi.fn();
});
afterEach(() => {
  cleanup();
  localStorage.clear();
  window.history.replaceState(null, '', '/');
  vi.unstubAllGlobals();
});

const response = (data: unknown) => new Response(JSON.stringify({ data }), { headers: { 'content-type': 'application/json' } });

function Probe() {
  return <output aria-label="modo da casca">{useColorScheme().mode}</output>;
}

it('theme.defaultMode abre a página no escuro mesmo com o sistema no claro', async () => {
  window.history.replaceState(null, '', '/probe');
  const app = {
    name: 'C3',
    entities: [],
    pages: [{ path: '/probe', component: 'Probe' }],
    layout: { menu: [] }
  };
  const transport = vi.fn(async () => response(app));
  render(<C3Shell apiUrl="/api" transport={transport} theme={{ defaultMode: 'dark', storageKey: 'shell-dark' }} components={{ Probe }} />);
  await waitFor(() => expect(screen.getByLabelText('modo da casca').textContent).toBe('dark'));
  expect(document.documentElement.getAttribute('data-c3-mode')).toBe('dark');
});

it('theme.defaultMode também vale na tela de entrada', async () => {
  const auth = { login: vi.fn(), me: vi.fn() } as unknown as AuthPort;
  const transport = vi.fn(async () => response({ name: 'C3', auth: {} }));
  render(<C3Shell apiUrl="/api" auth={auth} transport={transport} theme={{ defaultMode: 'dark', storageKey: 'login-dark' }} />);
  await screen.findByRole('button', { name: /entrar/i });
  expect(document.documentElement.getAttribute('data-c3-mode')).toBe('dark');
  expect(auth.me).not.toHaveBeenCalled();
});
