// @vitest-environment jsdom
// #123: entrada por código de e-mail, sem senha, declarada pela porta de autenticação.
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { C3ThemeProvider } from '@c3theme/ui';
import { rotasDeEntrada } from './AuthScreens';
import { AuthSessionProvider } from './session';
import type { AuthPort, SessaoDaPorta } from './port';
import CodeLoginPage from './pages/CodeLoginPage';
import CodeLoginVerifyPage from './pages/CodeLoginVerifyPage';

const SESSAO: SessaoDaPorta = { token: 'tok', user: { id: 'u1', name: 'Ana', email: 'ana@exemplo.com' } };

const resposta = (corpo: unknown) => new Response(JSON.stringify({ data: corpo }), { headers: { 'content-type': 'application/json' } });

/** Transporte falso: só o /_meta/login, que a sessão lê antes das telas. */
function transporteFalso() {
  return vi.fn(async (url: string) =>
    url.endsWith('/_meta/login') ? resposta({ name: 'C3', auth: {} }) : new Response('{}', { status: 404 })
  );
}

function portaPorCodigo(extra: Partial<AuthPort> = {}): AuthPort {
  return {
    entrada: 'codigo',
    me: vi.fn(),
    enviarCodigo: vi.fn(() => Promise.resolve()),
    entrarComCodigo: vi.fn(() => Promise.resolve(SESSAO)),
    ...extra
  } as AuthPort;
}

/** As telas do modo código num roteador de memória, com a sessão de verdade em volta. */
function montarPaginas(auth: AuthPort) {
  return render(
    <C3ThemeProvider>
      <AuthSessionProvider
        port={auth}
        apiUrl="/api"
        transport={transporteFalso()}
        loading={<p>carregando</p>}
        failed={(mensagem) => <p>{mensagem}</p>}
      >
        {() => (
          <MemoryRouter initialEntries={['/login']}>
            <Routes>
              <Route path="/login" element={<CodeLoginPage />} />
              <Route path="/codigo" element={<CodeLoginVerifyPage />} />
            </Routes>
          </MemoryRouter>
        )}
      </AuthSessionProvider>
    </C3ThemeProvider>
  );
}

/** Espera a entrada por código carregar e devolve o campo do e-mail. */
async function campoDeEmail(): Promise<HTMLInputElement> {
  return (await screen.findByLabelText('E-mail')) as HTMLInputElement;
}

async function preencherEmail(email = 'ana@exemplo.com'): Promise<void> {
  fireEvent.change(await campoDeEmail(), { target: { value: email } });
}

/** Entra na conferência do código pedindo o código do e-mail. */
async function irParaOCodigo(): Promise<void> {
  await preencherEmail();
  fireEvent.click(screen.getByRole('button', { name: 'Enviar código' }));
  await screen.findByText(/Digite o código de 6 dígitos/);
}

/** Digita o código completo (6 dígitos), uma casa de cada vez como o componente faz. */
function digitarCodigo(codigo: string): void {
  const entradas = screen.getAllByRole('textbox');
  for (const [indice, digito] of [...codigo].entries()) {
    fireEvent.change(entradas[indice]!, { target: { value: digito } });
  }
}

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
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

it('no modo código só existem entrada e conferência: nenhuma rota de senha é montada', () => {
  const rotas = rotasDeEntrada({}, portaPorCodigo()).map((rota) => rota.path);
  expect(rotas).toEqual(['login', 'codigo']);
});

it('sem declarar modo, a shell continua montando as rotas de senha', () => {
  const auth = {
    login: vi.fn(),
    me: vi.fn(),
    register: vi.fn(),
    forgotPassword: vi.fn(),
    verifyCode: vi.fn(),
    resetPassword: vi.fn()
  } as unknown as AuthPort;
  const rotas = rotasDeEntrada({ register: true, forgotPassword: true }, auth).map((rota) => rota.path);
  expect(rotas).toEqual(['login', 'register', 'forgot-password', 'check-mail', 'code-verification', 'reset-password']);
});

it('o foco começa no e-mail e Enter envia o código', async () => {
  const auth = portaPorCodigo();
  montarPaginas(auth);
  const email = await campoDeEmail();
  await waitFor(() => expect(document.activeElement).toBe(email));
  fireEvent.change(email, { target: { value: 'ana@exemplo.com' } });
  fireEvent.submit(email.closest('form')!);
  await waitFor(() => expect(auth.enviarCodigo).toHaveBeenCalledWith('ana@exemplo.com'));
});

it('e-mail inválido não pede código e mostra a mensagem no campo', async () => {
  const auth = portaPorCodigo();
  montarPaginas(auth);
  fireEvent.change(await campoDeEmail(), { target: { value: 'sem-arroba' } });
  fireEvent.click(screen.getByRole('button', { name: 'Enviar código' }));
  expect(await screen.findByText('Informe um e-mail válido.')).toBeTruthy();
  expect(auth.enviarCodigo).not.toHaveBeenCalled();
});

it('depois de enviar, a conferência abre com o e-mail na mensagem e o foco na primeira casa', async () => {
  montarPaginas(portaPorCodigo());
  await irParaOCodigo();
  expect(screen.getByText(/ana@exemplo\.com/)).toBeTruthy();
  const casas = screen.getAllByRole('textbox');
  expect(casas).toHaveLength(6);
  await waitFor(() => expect(document.activeElement).toBe(casas[0]));
});

it('código inválido mostra o estado e mantém a pessoa na conferência', async () => {
  const auth = portaPorCodigo({
    entrarComCodigo: vi.fn(() => Promise.reject(Object.assign(new Error('recusado'), { code: 'codigo-invalido' })))
  });
  montarPaginas(auth);
  await irParaOCodigo();
  digitarCodigo('123456');
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
  expect(await screen.findByText('Código inválido. Confira os dígitos e tente de novo.')).toBeTruthy();
  expect(screen.getByText(/Digite o código de 6 dígitos/)).toBeTruthy();
});

it('código expirado pede reenvio e o reenvio pede outro código', async () => {
  const auth = portaPorCodigo({
    entrarComCodigo: vi.fn(() => Promise.reject(Object.assign(new Error('vencido'), { code: 'codigo-expirado' })))
  });
  montarPaginas(auth);
  await irParaOCodigo();
  digitarCodigo('123456');
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
  expect(await screen.findByText('O código expirou. Peça um novo código.')).toBeTruthy();
  fireEvent.click(await screen.findByText('Reenviar código'));
  await waitFor(() => expect(auth.enviarCodigo).toHaveBeenCalledTimes(2));
});

it('muitas tentativas mostra o estado próprio', async () => {
  const auth = portaPorCodigo({
    entrarComCodigo: vi.fn(() => Promise.reject(Object.assign(new Error('bloqueado'), { code: 'muitas-tentativas' })))
  });
  montarPaginas(auth);
  await irParaOCodigo();
  digitarCodigo('123456');
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
  expect(await screen.findByText('Muitas tentativas. Peça um novo código e tente mais tarde.')).toBeTruthy();
});

it('sem rede no envio mostra o estado de conexão', async () => {
  const auth = portaPorCodigo({ enviarCodigo: vi.fn(() => Promise.reject(new Error('Sem conexão com o servidor.'))) });
  montarPaginas(auth);
  await preencherEmail();
  fireEvent.click(screen.getByRole('button', { name: 'Enviar código' }));
  expect(await screen.findByText('Sem conexão com o servidor.')).toBeTruthy();
});

it('o código certo entrega e-mail e código à porta, sem senha', async () => {
  const auth = portaPorCodigo();
  montarPaginas(auth);
  await irParaOCodigo();
  digitarCodigo('123456');
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
  await waitFor(() => expect(auth.entrarComCodigo).toHaveBeenCalledWith('ana@exemplo.com', '123456'));
  expect(auth.login).toBeUndefined();
});

it('a espera do reenvio conta e libera o botão ao acabar', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  montarPaginas(portaPorCodigo());
  await preencherEmail();
  fireEvent.click(screen.getByRole('button', { name: 'Enviar código' }));
  await screen.findByText(/Digite o código de 6 dígitos/);
  expect(screen.getByText(/Reenviar em 30s/)).toBeTruthy();
  for (let segundo = 0; segundo < 30; segundo += 1) {
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
  }
  expect(screen.getByText('Reenviar código')).toBeTruthy();
});

it('falha ao reenviar mostra o estado e não zera a espera', async () => {
  let chamadas = 0;
  const auth = portaPorCodigo({
    enviarCodigo: vi.fn(() => {
      chamadas += 1;
      return chamadas === 1 ? Promise.resolve() : Promise.reject(Object.assign(new Error('sem rede'), { code: 'sem-rede' }));
    }),
    entrarComCodigo: vi.fn(() => Promise.reject(Object.assign(new Error('vencido'), { code: 'codigo-expirado' })))
  });
  montarPaginas(auth);
  await irParaOCodigo();
  digitarCodigo('123456');
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
  fireEvent.click(await screen.findByText('Reenviar código'));
  expect(await screen.findByText('Sem conexão com o servidor. Verifique a rede e tente de novo.')).toBeTruthy();
});
