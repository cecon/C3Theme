// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

import { createClient } from './api';
import { httpAuth } from './auth/httpAuth';
import { createShellRouter } from './router';
import type { C3Fetch } from './transport';

const json = (body: unknown, status = 200) => Response.json(body, { status });

describe('transporte injetável', () => {
  it('o cliente pede pelo transporte, não pelo fetch global', async () => {
    const global = vi.spyOn(globalThis, 'fetch');
    const transport = vi.fn<C3Fetch>(async () => json({ data: { name: 'ERP' } }));
    const client = createClient('', () => ({ 'C3-Branch': 'f1' }), undefined, transport);
    expect((await client.app()).name).toBe('ERP');
    expect(transport).toHaveBeenCalledWith('/_meta/app', expect.objectContaining({ method: 'GET', headers: { 'C3-Branch': 'f1' } }));
    expect(global).not.toHaveBeenCalled();
    global.mockRestore();
  });

  it('erro do transporte vira o erro de rede do contrato', async () => {
    const client = createClient('', undefined, undefined, async () => {
      throw new TypeError('ipc caiu');
    });
    await expect(client.app()).rejects.toMatchObject({ status: 0, code: 'network' });
  });

  it('o tempo real lê o fluxo do transporte', async () => {
    const transport: C3Fetch = async () => new Response('event: change\ndata: {"change":"created","id":"9"}\n\n');
    const seen: unknown[] = [];
    await createClient('', undefined, undefined, transport).events!('pedidos', (m) => seen.push(m), new AbortController().signal);
    expect(seen).toEqual([{ type: 'change', change: 'created', id: '9' }]);
  });

  it('o httpAuth usa o mesmo transporte', async () => {
    const transport = vi.fn<C3Fetch>(async () => json({ user: { id: '1', name: 'Ana' } }));
    expect(await httpAuth('', transport).me('tok')).toEqual({ id: '1', name: 'Ana' });
    expect(transport.mock.calls[0][0]).toBe('/auth/me');
  });
});

describe('roteador', () => {
  it('hash: a rota vem depois do #, não do caminho do arquivo', () => {
    window.history.replaceState(null, '', '/C:/app/index.html#/clientes');
    const router = createShellRouter('hash', [{ path: '/clientes' }, { path: '*' }]);
    expect(router.state.location.pathname).toBe('/clientes');
    expect(router.state.matches.at(-1)?.route.path).toBe('/clientes');
    router.dispose();
  });

  it('browser: a rota é o caminho', () => {
    window.history.replaceState(null, '', '/clientes');
    const router = createShellRouter('browser', [{ path: '/clientes' }]);
    expect(router.state.location.pathname).toBe('/clientes');
    router.dispose();
  });
});
