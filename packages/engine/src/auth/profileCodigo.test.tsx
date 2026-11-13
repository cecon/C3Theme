// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, expect, it, vi } from 'vitest';
import { C3ThemeProvider } from '@c3theme/ui';
import { AuthSessionProvider } from './session';
import ProfilePage from './pages/ProfilePage';
afterEach(() => {
  cleanup();
  localStorage.clear();
});
it('perfil de porta código não monta senha, inclusive ao abrir ?aba=senha', async () => {
  localStorage.setItem('c3.token', 'token-de-teste');
  const user = { id: 'u', name: 'Ana' };
  render(
    <C3ThemeProvider>
      <AuthSessionProvider
        apiUrl="/api"
        port={{ entrada: 'codigo', me: async () => user, updateProfile: vi.fn(), changePassword: vi.fn() }}
        transport={async () =>
          new Response(JSON.stringify({ data: { name: 'Equipe', auth: {} } }), { headers: { 'content-type': 'application/json' } })
        }
        loading={null}
        failed={(error) => <p>{error}</p>}
      >
        {() => (
          <MemoryRouter initialEntries={['/perfil?aba=senha']}>
            <ProfilePage />
          </MemoryRouter>
        )}
      </AuthSessionProvider>
    </C3ThemeProvider>
  );
  expect(await screen.findByRole('tab', { name: 'Dados pessoais' })).toBeTruthy();
  expect(screen.queryByRole('tab', { name: 'Senha' })).toBeNull();
  expect(screen.queryByLabelText('Senha atual')).toBeNull();
});
