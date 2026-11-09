// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { login, openShell, startExampleBackend } from './shell.test-utils';

const backend = startExampleBackend();

describe('entrada e painel (CRM de exemplo)', () => {
  it('sem sessão abre o login; senha errada mostra o erro; certa entra no painel', async () => {
    await openShell(backend.api(), '/', null);
    expect(await screen.findByText(/entre como admin, ana ou caio/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/Usuário/i), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('Senha', { selector: 'input' }), { target: { value: 'errada' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByText('Usuário ou senha incorretos.')).toBeTruthy();
    await login('admin');
    expect(await screen.findByText('Clientes ativos', {}, { timeout: 5000 })).toBeTruthy();
  });
});
