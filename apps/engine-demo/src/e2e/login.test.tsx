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
    // banco novo, sem cliente: o painel mostra o vazio declarado em pages[].states (#99) com o próximo passo
    expect(await screen.findByText(/Nenhum cliente ainda/, {}, { timeout: 5000 })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Novo cliente' }).getAttribute('href')).toBe('/customer/new');
  });
});
