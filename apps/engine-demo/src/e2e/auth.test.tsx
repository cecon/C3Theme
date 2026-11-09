// @vitest-environment jsdom
// Telas de entrada que o exemplo não liga (cadastro, recuperar senha, perfil): o mesmo backend, com a porta de
// autenticação estendida pelo teste e o `auth` do /_meta/login ligando os fluxos.
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { httpAuth, type AuthPort, type C3Fetch } from '@c3theme/engine';
import { describe, expect, it, vi } from 'vitest';

import { openShell, startExampleBackend } from './shell.test-utils';

const backend = startExampleBackend();

/** O `auth` do app.json com cadastro, recuperação e perfil ligados (o exemplo desliga). */
const withFlows: C3Fetch = async (url, init) => {
  const res = await fetch(url, init);
  if (!url.endsWith('/_meta/login')) return res;
  const { data } = (await res.json()) as { data: { auth: Record<string, unknown> } };
  return Response.json({ data: { ...data, auth: { ...data.auth, register: true, forgotPassword: true, profile: true } } });
};

type Mocked = ReturnType<typeof vi.fn>;
type TestPort = AuthPort & {
  [K in 'register' | 'forgotPassword' | 'verifyCode' | 'resetPassword' | 'updateProfile' | 'changePassword']: Mocked;
};

function port(): TestPort {
  const base = httpAuth(backend.api());
  return {
    ...base,
    register: vi.fn().mockResolvedValue(undefined),
    forgotPassword: vi.fn().mockResolvedValue(undefined),
    verifyCode: vi
      .fn()
      .mockImplementation((_: string, code: string) =>
        code === '123456' ? Promise.resolve() : Promise.reject(new Error('Código inválido.'))
      ),
    resetPassword: vi.fn().mockResolvedValue(undefined),
    updateProfile: vi
      .fn()
      .mockImplementation(async (_: string, c: { name?: string }) => ({ id: 'admin', name: c.name ?? '', email: 'admin@exemplo.com' })),
    changePassword: vi.fn().mockRejectedValueOnce(new Error('Senha atual incorreta.')).mockResolvedValue(undefined)
  } as TestPort;
}

const type = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label, { selector: 'input' }), { target: { value } });

describe('cadastro, senha esquecida e perfil', () => {
  it('cadastro: confere os campos e volta ao login com a conta criada', async () => {
    const auth = port();
    await openShell(backend.api(), '/login', null, { auth, transport: withFlows });
    fireEvent.click(await screen.findByRole('link', { name: 'Cadastre-se' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Criar conta' }));
    expect(screen.getByText('Informe seu nome.')).toBeTruthy();
    expect(screen.getByText('Aceite os termos para continuar.')).toBeTruthy();
    type('Nome completo', 'Dora Lima');
    fireEvent.change(screen.getAllByRole('textbox')[1], { target: { value: 'dora' } });
    type('Senha', 'curta');
    expect(screen.getByText('Use pelo menos 8 caracteres.')).toBeTruthy();
    type('Senha', 'S3nha-forte!');
    type('Confirmar senha', 'outra');
    expect(screen.getByText('As senhas não conferem.')).toBeTruthy();
    type('Confirmar senha', 'S3nha-forte!');
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
    await waitFor(() => expect(auth.register).toHaveBeenCalledWith({ name: 'Dora Lima', identifier: 'dora', password: 'S3nha-forte!' }));
    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeTruthy();
  });

  it('esqueci a senha: código por e-mail, código errado avisa, certo leva à senha nova', async () => {
    const auth = port();
    await openShell(backend.api(), '/login', null, { auth, transport: withFlows });
    fireEvent.click(await screen.findByRole('link', { name: 'Esqueci a senha' }));
    fireEvent.change(await screen.findByRole('textbox'), { target: { value: 'ana' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar código' }));
    expect(await screen.findByText('Confira seu e-mail')).toBeTruthy();
    expect(auth.forgotPassword).toHaveBeenCalledWith('ana');
    fireEvent.click(screen.getByRole('link', { name: /código/i }));
    fireEvent.click(await screen.findByRole('button', { name: 'Continuar' }));
    expect(screen.getByText('Digite os 6 dígitos do código.')).toBeTruthy();
    const digits = screen.getAllByRole('textbox');
    '999999'.split('').forEach((d, i) => fireEvent.change(digits[i], { target: { value: d } }));
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(await screen.findByText('Código inválido.')).toBeTruthy();
    '123456'.split('').forEach((d, i) => fireEvent.change(screen.getAllByRole('textbox')[i], { target: { value: d } }));
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(await screen.findByText('Nova senha')).toBeTruthy();
    type('Senha nova', 'N0va-senha!');
    type('Confirmar senha', 'N0va-senha!');
    fireEvent.click(screen.getByRole('button', { name: 'Salvar senha' }));
    await waitFor(() => expect(auth.resetPassword).toHaveBeenCalledWith('ana', '123456', 'N0va-senha!'));
    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeTruthy();
  });

  it('perfil: altera o nome e troca a senha (erro do sistema aparece, depois passa)', async () => {
    const auth = port();
    await openShell(backend.api(), '/perfil', 'admin', { auth, transport: withFlows });
    const nome = await screen.findByLabelText('Nome', { selector: 'input' });
    fireEvent.change(nome, { target: { value: 'Admin Novo' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    await waitFor(() => expect(auth.updateProfile).toHaveBeenCalledWith('admin', { name: 'Admin Novo', phone: '' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Senha' }));
    type('Senha atual', 'c3');
    type('Senha nova', 'Outr4-senha!');
    type('Confirmar senha nova', 'Outr4-senha!');
    fireEvent.click(screen.getByRole('button', { name: 'Alterar senha' }));
    expect(await screen.findByText('Senha atual incorreta.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Alterar senha' }));
    await waitFor(() => expect(auth.changePassword).toHaveBeenCalledTimes(2));
  });
});
