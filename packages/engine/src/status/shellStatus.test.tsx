// @vitest-environment jsdom
// A shell com o sistema fora do ar e com erro (#81): `status` do app.json, 503 em /_meta/*, falha ao abrir, página
// `comingSoon` e tela que quebra dentro do layout.
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import C3Shell from '../C3Shell';
import type { AuthPort } from '../auth/port';
import type { C3Fetch } from '../transport';

type Reply = { status?: number; body?: unknown; headers?: Record<string, string> };

/** Transporte falso: cada caminho responde a próxima resposta da fila (a última se repete). */
function fakeTransport(routes: Record<string, Reply[]>) {
  const calls: string[] = [];
  const transport: C3Fetch = async (url) => {
    const path = url.replace(/^\/api/, '').split('?')[0]!;
    calls.push(path);
    const queue = routes[path];
    if (!queue) return new Response(JSON.stringify({ error: { code: 'not_found', message: 'x' } }), { status: 404 });
    const r = queue.length > 1 ? queue.shift()! : queue[0]!;
    const body = typeof r.body === 'string' ? r.body : JSON.stringify(r.body ?? {});
    return new Response(body, { status: r.status ?? 200, headers: { 'content-type': 'application/json', ...r.headers } });
  };
  return { transport, calls };
}

const app = (extra: Record<string, unknown> = {}) => ({
  specVersion: '0',
  name: 'Loja',
  entities: [],
  homePath: '/breve',
  pages: [
    { path: '/breve', title: 'Relatórios', comingSoon: { message: 'Chega em dezembro.' } },
    { path: '/quebra', title: 'Quebra', component: 'Boom' },
    { path: '/quiosque', title: 'Quiosque', component: 'Boom', layout: 'blank' }
  ],
  layout: { menu: [{ title: 'Geral', items: [{ title: 'Relatórios', path: '/breve' }] }] },
  ...extra
});

function Boom(): never {
  throw new Error('quebrou');
}

/** A tela (MessagePage, pai do título) ocupa a altura toda? */
const fullPage = (heading: HTMLElement) => !/^(auto)?$/.test(getComputedStyle(heading.parentElement!).minHeight);

beforeEach(() => window.history.pushState({}, '', '/'));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('C3Shell fora do ar', () => {
  it('status no app.json: só a tela de manutenção, sem pedir entidades', async () => {
    const status = { mode: 'maintenance', message: 'Trocando o servidor.' };
    const { transport, calls } = fakeTransport({ '/_meta/app': [{ body: { data: app({ entities: ['cliente'], status }) } }] });
    render(<C3Shell apiUrl="/api" transport={transport} />);
    expect(await screen.findByRole('heading', { name: 'Em manutenção' })).toBeTruthy();
    expect(screen.getByText('Trocando o servidor.')).toBeTruthy();
    expect(calls).toEqual(['/_meta/app']);
  });

  it('503 em /_meta/app com Retry-After: manutenção com previsão; "Tentar de novo" abre o sistema quando volta', async () => {
    const { transport } = fakeTransport({
      '/_meta/app': [{ status: 503, body: '<html>fora</html>', headers: { 'retry-after': '600' } }, { body: { data: app() } }]
    });
    render(<C3Shell apiUrl="/api" transport={transport} />);
    expect(await screen.findByRole('heading', { name: 'Em manutenção' })).toBeTruthy();
    expect(screen.getByText(/^Previsão de retorno: /)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    // a página `comingSoon` do início: "Em breve" no meio do layout
    expect(fullPage(await screen.findByRole('heading', { name: 'Em breve' }))).toBe(false);
    expect(screen.getByText('Chega em dezembro.')).toBeTruthy();
    expect(screen.queryByText('Em manutenção')).toBeNull();
  });

  it('falha ao abrir (500): a tela de erro com o código; cada "Tentar de novo" pergunta outra vez', async () => {
    const down = { status: 500, body: { error: { code: 'internal', message: 'Banco fora.' } } };
    const { transport, calls } = fakeTransport({ '/_meta/app': [down, down, { body: { data: app() } }] });
    render(<C3Shell apiUrl="/api" transport={transport} />);
    expect(await screen.findByText('500')).toBeTruthy();
    expect(screen.getByText('Banco fora.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    await waitFor(() => expect(calls).toHaveLength(2));
    fireEvent.click(await screen.findByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByRole('heading', { name: 'Em breve' })).toBeTruthy();
    expect(screen.queryByText('Banco fora.')).toBeNull();
  });

  it('uma tela que quebra mostra o 500 dentro do layout: o menu continua', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    window.history.pushState({}, '', '/quebra');
    const { transport } = fakeTransport({ '/_meta/app': [{ body: { data: app() } }] });
    render(<C3Shell apiUrl="/api" transport={transport} components={{ Boom }} />);
    expect(fullPage(await screen.findByRole('heading', { name: 'Algo deu errado' }))).toBe(false);
    expect(screen.getAllByText('Relatórios').length).toBeGreaterThan(0);
  });

  it('página em branco que quebra: o 500 ocupa a tela toda, sem o menu', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    window.history.pushState({}, '', '/quiosque');
    const { transport } = fakeTransport({ '/_meta/app': [{ body: { data: app() } }] });
    render(<C3Shell apiUrl="/api" transport={transport} components={{ Boom }} />);
    expect(fullPage(await screen.findByRole('heading', { name: 'Algo deu errado' }))).toBe(true);
    expect(screen.queryByText('Relatórios')).toBeNull();
  });

  it('rota que não existe: 404 com "Voltar ao início"', async () => {
    window.history.pushState({}, '', '/nada');
    const { transport } = fakeTransport({ '/_meta/app': [{ body: { data: app() } }] });
    render(<C3Shell apiUrl="/api" transport={transport} />);
    expect(await screen.findByRole('heading', { name: 'Página não encontrada' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Voltar ao início' })).toBeTruthy();
  });
});

describe('C3Shell com login fora do ar', () => {
  const port: AuthPort = { login: vi.fn(), me: vi.fn(async () => ({ id: '1', name: 'Ana' })) };

  it('status em /_meta/login: "Em breve" no lugar do login, sem validar o token', async () => {
    const status = { mode: 'comingSoon', title: 'Lançamento', until: '2999-01-01T00:00:00Z' };
    const { transport } = fakeTransport({ '/_meta/login': [{ body: { data: { name: 'Loja', auth: {}, status } } }] });
    render(<C3Shell apiUrl="/api" transport={transport} auth={port} />);
    expect(await screen.findByRole('heading', { name: 'Lançamento' })).toBeTruthy();
    expect(screen.getByRole('timer')).toBeTruthy();
    expect(port.me).not.toHaveBeenCalled();
  });

  it('503 em /_meta/login: manutenção; "Tentar de novo" volta ao login quando o sistema volta', async () => {
    const { transport } = fakeTransport({
      '/_meta/login': [
        { status: 503, body: { status: { mode: 'maintenance', message: 'Volta às 18h.' } } },
        { status: 503, body: { status: { mode: 'maintenance', message: 'Volta às 18h.' } } },
        { body: { data: { name: 'Loja', auth: {} } } }
      ]
    });
    render(<C3Shell apiUrl="/api" transport={transport} auth={port} />);
    expect(await screen.findByText('Volta às 18h.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByText('Volta às 18h.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeTruthy();
  });

  it('503 sem corpo JSON em /_meta/login: manutenção com o texto padrão', async () => {
    const { transport } = fakeTransport({ '/_meta/login': [{ status: 503, body: 'fora' }] });
    render(<C3Shell apiUrl="/api" transport={transport} auth={port} />);
    expect(await screen.findByRole('heading', { name: 'Em manutenção' })).toBeTruthy();
  });

  it('erro em /_meta/login: a tela de falha ao abrir', async () => {
    const { transport } = fakeTransport({ '/_meta/login': [{ status: 502 }] });
    render(<C3Shell apiUrl="/api" transport={transport} auth={port} />);
    expect(await screen.findByRole('heading', { name: 'Não foi possível abrir o sistema' })).toBeTruthy();
    expect(screen.getByText('Erro 502.')).toBeTruthy();
  });
});
