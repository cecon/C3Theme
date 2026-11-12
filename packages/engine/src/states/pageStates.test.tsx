// @vitest-environment jsdom
// Estados da página pela spec (#99): a shell conta a `statesEntity` e desenha carregando, vazio, erro, sem permissão e
// offline com os textos e ações do app.json; estado não declarado fica com o padrão e página sem `states` é a de antes.
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import C3Shell from '../C3Shell';
import type { C3Fetch } from '../transport';
import type { ConnectivityPort } from './connectivity';
import type { StatesDef } from './states';

type Reply = { status?: number; body?: unknown } | 'network' | 'pending';

let n = 0;

/**
 * Transporte falso: /_meta/app com a página e, na contagem, a próxima resposta da fila (a última se repete). Cada
 * chamada usa outra entidade: o cache do SWR é global e não vaza de um teste para o outro.
 */
function shell(base: Record<string, unknown>, counts: Reply[] = [], pages: Record<string, boolean> = {}) {
  const entity = `venda${++n}`;
  const page = JSON.parse(JSON.stringify(base).replaceAll('"venda"', `"${entity}"`)) as Record<string, unknown>;
  const calls: string[] = [];
  const transport: C3Fetch = async (url) => {
    const path = url.replace(/^\/api/, '').split('?')[0]!;
    calls.push(path.replace(entity, 'venda'));
    if (path === '/_meta/app') return json({ data: app(page), pages });
    const r = counts.length > 1 ? counts.shift()! : counts[0];
    if (r === 'network') throw new TypeError('Failed to fetch');
    if (r === 'pending') return new Promise<Response>(() => {});
    return json(r?.body ?? { error: { code: 'x', message: 'x' } }, r?.status ?? 200);
  };
  return { transport, calls };
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const count = (n: number) => ({ body: { data: [{ key: null, value: n }] } });

const app = (page: Record<string, unknown>) => ({
  specVersion: '0',
  name: 'Loja',
  entities: [],
  homePath: '/caixa',
  pages: [{ path: '/caixa', title: 'Caixa', component: 'Caixa', ...page }],
  layout: { menu: [{ title: 'Geral', items: [{ title: 'Caixa', path: '/caixa' }] }] }
});

const all: StatesDef = {
  loading: { text: 'Carregando o caixa do dia' },
  empty: { text: 'Nenhuma venda hoje.', action: { label: 'Abrir o caixa', path: '/abrir' } },
  error: { text: 'Não deu para ler o caixa.', retry: 'Ler de novo' },
  forbidden: {
    text: 'Você não vê o caixa.',
    howTo: 'Peça ao gerente o perfil Caixa.',
    action: { label: 'Pedir acesso', href: 'https://ajuda.exemplo/acesso' }
  },
  offline: { text: 'Sem conexão com a loja.', keeps: ['Ver as vendas já abertas', 'Imprimir o último cupom'] }
};

function Caixa() {
  return <p>Corpo do caixa</p>;
}

/** Porta de conexão de teste: começa no valor dado e muda com `set`. */
function fakeConnectivity(start: boolean) {
  let online = start;
  const subs = new Set<(v: boolean) => void>();
  const port: ConnectivityPort = {
    online: () => online,
    subscribe: (cb) => (subs.add(cb), () => void subs.delete(cb))
  };
  const set = (v: boolean) => act(() => ((online = v), subs.forEach((cb) => cb(v))));
  return { port, set };
}

const open = (transport: C3Fetch, connectivity?: ConnectivityPort) =>
  render(<C3Shell apiUrl="/api" transport={transport} components={{ Caixa }} connectivity={connectivity} />);

beforeEach(() => window.history.pushState({}, '', '/caixa'));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('estados da página com statesEntity', () => {
  it('contagem zero: o vazio declarado com a ação do próximo passo, sem o corpo', async () => {
    const { transport, calls } = shell({ statesEntity: 'venda', states: all }, [count(0)]);
    open(transport);
    expect(await screen.findByText('Nenhuma venda hoje.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Abrir o caixa' }).getAttribute('href')).toBe('/abrir');
    expect(screen.queryByText('Corpo do caixa')).toBeNull();
    expect(calls).toContain('/venda/_aggregate');
  });

  it('com registros: desenha o corpo', async () => {
    const { transport } = shell({ statesEntity: 'venda', states: all }, [count(3)]);
    open(transport);
    expect(await screen.findByText('Corpo do caixa')).toBeTruthy();
  });

  it('enquanto conta: o texto do carregando, como status', async () => {
    const { transport } = shell({ statesEntity: 'venda', states: all }, ['pending']);
    open(transport);
    expect((await screen.findByRole('status')).textContent).toBe('Carregando o caixa do dia');
    expect(screen.getByText('Carregando o caixa do dia', { selector: 'p' }).getAttribute('aria-hidden')).toBe('true');
  });

  it('erro: a mensagem e o botão declarado, que conta de novo', async () => {
    const { transport } = shell({ statesEntity: 'venda', states: all }, [{ status: 500 }, count(2)]);
    open(transport);
    expect((await screen.findByRole('alert')).textContent).toBe('Não deu para ler o caixa.');
    fireEvent.click(screen.getByRole('button', { name: 'Ler de novo' }));
    expect(await screen.findByText('Corpo do caixa')).toBeTruthy();
  });

  it('erro sem rótulo declarado: "Tentar de novo"', async () => {
    const { transport } = shell({ statesEntity: 'venda', states: { error: { text: 'Falhou.' } } }, [{ status: 500 }]);
    open(transport);
    expect(await screen.findByRole('button', { name: 'Tentar de novo' })).toBeTruthy();
  });

  it('403 na contagem: sem permissão com o como conseguir e o link de fora', async () => {
    const { transport } = shell({ statesEntity: 'venda', states: all }, [{ status: 403 }]);
    open(transport);
    expect(await screen.findByText('Você não vê o caixa.')).toBeTruthy();
    expect(screen.getByText('Peça ao gerente o perfil Caixa.')).toBeTruthy();
    const link = screen.getByRole('link', { name: 'Pedir acesso' });
    expect(link.getAttribute('href')).toBe('https://ajuda.exemplo/acesso');
    expect(link.getAttribute('target')).toBe('_blank');
  });

  it('pedido que não chegou ao servidor: o offline declarado, com o que continua funcionando', async () => {
    const { transport } = shell({ statesEntity: 'venda', states: all }, ['network']);
    open(transport);
    expect(await screen.findByText('Sem conexão com a loja.')).toBeTruthy();
    expect(screen.getByText('Imprimir o último cupom')).toBeTruthy();
    expect(screen.queryByText('Corpo do caixa')).toBeNull();
  });

  it('sem conexão sem offline declarado: cai no erro declarado', async () => {
    const { transport } = shell({ statesEntity: 'venda', states: { error: { text: 'Falhou.' } } }, ['network']);
    open(transport);
    expect((await screen.findByRole('alert')).textContent).toBe('Falhou.');
  });

  it('o navegador já sabe que caiu: só o aviso do alto, sem repetir embaixo', async () => {
    const { port } = fakeConnectivity(false);
    const { transport } = shell({ statesEntity: 'venda', states: all }, ['network']);
    open(transport, port);
    expect(await screen.findByText('Sem conexão com a loja.')).toBeTruthy();
    await waitFor(() => expect(screen.getAllByText('Sem conexão com a loja.')).toHaveLength(1));
  });

  it('estados não declarados: esqueleto sem texto, e o corpo no vazio e no erro', async () => {
    const pending = shell({ statesEntity: 'venda' }, ['pending']);
    const { unmount } = open(pending.transport);
    await waitFor(() => expect(pending.calls).toContain('/venda/_aggregate'));
    expect(screen.queryByRole('status')).toBeNull();
    unmount();
    for (const reply of [count(0), { status: 500 }]) {
      const { transport } = shell({ statesEntity: 'venda' }, [reply]);
      const r = open(transport);
      expect(await screen.findByText('Corpo do caixa')).toBeTruthy();
      r.unmount();
    }
  });

  it('painel com statesEntity: o vazio no lugar dos widgets', async () => {
    const dashboard = { widgets: [{ type: 'kpi', title: 'Vendas', entity: 'venda' }] };
    const { transport } = shell({ component: undefined, dashboard, statesEntity: 'venda', states: all }, [count(0)]);
    open(transport);
    expect(await screen.findByText('Nenhuma venda hoje.')).toBeTruthy();
  });
});

describe('sem permissão e offline em qualquer página', () => {
  it('página negada no /_meta/app: o recado declarado no lugar do aviso fixo', async () => {
    const { transport, calls } = shell({ permission: 'caixa', states: { forbidden: all.forbidden } }, [], { '/caixa': false });
    open(transport);
    expect(await screen.findByText('Peça ao gerente o perfil Caixa.')).toBeTruthy();
    expect(screen.queryByText('Você não tem permissão para abrir esta página.')).toBeNull();
    expect(calls).not.toContain('/venda/_aggregate');
  });

  it('página negada sem states: o aviso de sempre', async () => {
    const { transport } = shell({ permission: 'caixa' }, [], { '/caixa': false });
    open(transport);
    expect(await screen.findByText('Você não tem permissão para abrir esta página.')).toBeTruthy();
  });

  it('a conexão cai: aviso no alto e o corpo continua; volta: o aviso some', async () => {
    const { port, set } = fakeConnectivity(true);
    const { transport } = shell({ states: { offline: all.offline } });
    open(transport, port);
    expect(await screen.findByText('Corpo do caixa')).toBeTruthy();
    set(false);
    expect(screen.getByText('Sem conexão com a loja.')).toBeTruthy();
    expect(screen.getByText('Continua funcionando:')).toBeTruthy();
    expect(screen.getByText('Corpo do caixa')).toBeTruthy();
    set(true);
    expect(screen.queryByText('Sem conexão com a loja.')).toBeNull();
  });

  it('página sem states: nada muda, nem sem conexão, e não conta nada', async () => {
    const { port } = fakeConnectivity(false);
    const { transport, calls } = shell({});
    open(transport, port);
    expect(await screen.findByText('Corpo do caixa')).toBeTruthy();
    expect(screen.queryByRole('status')).toBeNull();
    expect(calls).toEqual(['/_meta/app']);
  });
});
