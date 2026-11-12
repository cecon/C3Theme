// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { IntlProvider } from 'react-intl';
import { C3ThemeProvider } from '@c3theme/ui';
import C3Shell from '../C3Shell';
import type { AuthPort } from '../auth/port';
import { tokenStore } from '../auth/session';
import { AppStatus, ShellBoundary } from './AppStatus';

beforeAll(() => {
  window.scrollTo = vi.fn();
});
afterEach(() => {
  cleanup();
  tokenStore.set(null);
  window.history.replaceState(null, '', '/');
  vi.restoreAllMocks();
});
const status = { mode: 'maintenance' as const, message: 'Atualizando o sistema', until: '2026-11-13T15:00:00Z' };
const app = { name: 'Teste', entities: ['nota'], layout: { menu: [] }, status };
const json = (data: unknown) => new Response(JSON.stringify({ data }), { status: 200, headers: { 'content-type': 'application/json' } });

describe('status público da shell', () => {
  it('substitui as páginas e não pede entidades enquanto em manutenção', async () => {
    const transport = vi.fn(async () => json(app));
    render(<C3Shell apiUrl="/api" transport={transport} icons={{}} />);
    expect(await screen.findByText('Em manutenção')).toBeTruthy();
    expect(screen.getByText('Atualizando o sistema')).toBeTruthy();
    expect(screen.getByText(/Previsão de retorno:/)).toBeTruthy();
    expect(transport.mock.calls).toHaveLength(1);
  });

  it('mostra lançamento traduzido, sem previsão quando não declarada', () => {
    render(
      <IntlProvider locale="en" messages={{ coming: 'Coming soon' }}>
        <AppStatus status={{ mode: 'comingSoon', title: { id: 'coming' } }} />
      </IntlProvider>
    );
    expect(screen.getByText('Coming soon')).toBeTruthy();
    expect(screen.queryByText(/Lançamento:/)).toBeNull();
  });

  it('em breve exibe a data e a mensagem declaradas', () => {
    render(
      <IntlProvider locale="pt-BR" onError={() => {}}>
        <AppStatus status={{ mode: 'comingSoon', message: 'Nova loja', until: status.until }} />
      </IntlProvider>
    );
    expect(screen.getByText('Em breve')).toBeTruthy();
    expect(screen.getByText('Nova loja')).toBeTruthy();
    expect(screen.getByText(/Lançamento:/)).toBeTruthy();
  });

  it('antes do login, preserva o token e não chama a autenticação nem metadados protegidos', async () => {
    tokenStore.set('guardado');
    const port: AuthPort = { login: vi.fn(), me: vi.fn() };
    const transport = vi.fn(async () => json({ name: 'Teste', auth: {}, status }));
    render(<C3Shell apiUrl="/api" auth={port} transport={transport} icons={{}} />);
    expect(await screen.findByText('Em manutenção')).toBeTruthy();
    expect(port.me).not.toHaveBeenCalled();
    expect(port.login).not.toHaveBeenCalled();
    expect(tokenStore.get()).toBe('guardado');
    expect(transport.mock.calls).toHaveLength(1);
  });

  it('falha em uma página mostra 500 em tela cheia, sem mensagem interna', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    window.history.replaceState(null, '', '/quebra');
    function Broken(): never {
      throw new Error('detalhe privado');
    }
    const transport = vi.fn(async () =>
      json({ ...app, status: undefined, entities: [], pages: [{ path: '/quebra', component: 'Broken' }] })
    );
    render(<C3Shell apiUrl="/api" transport={transport} components={{ Broken }} icons={{}} />);
    expect(await screen.findByText('500')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeTruthy();
    expect(screen.queryByText('detalhe privado')).toBeNull();
  });

  it('boundary também cobre falhas fora das rotas', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    function Broken(): never {
      throw new Error('privado');
    }
    render(
      <C3ThemeProvider>
        <ShellBoundary>
          <Broken />
        </ShellBoundary>
      </C3ThemeProvider>
    );
    expect(screen.getByText('500')).toBeTruthy();
    expect(screen.queryByText('privado')).toBeNull();
  });
});
