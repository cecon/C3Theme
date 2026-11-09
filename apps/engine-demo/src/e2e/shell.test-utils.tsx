// Shell inteira (C3Shell) contra o CRM de exemplo de verdade: o @c3theme/engine-node em processo, num banco
// temporário, servido por HTTP local. O teste clica como o usuário e o motor responde como em produção.
import { mkdtempSync, rmSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { cleanup, configure, render, screen, waitFor } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { exampleServer } from '@c3theme/c3-example-node/src/server';
import { C3Shell, httpAuth, type C3ShellProps } from '@c3theme/engine';
import { afterAll, afterEach, beforeAll, expect, vi } from 'vitest';

// a shell faz vários pedidos HTTP de verdade por tela
vi.setConfig({ testTimeout: 20_000 });
configure({ asyncUtilTimeout: 5_000 });

/** Sobe o backend uma vez por arquivo de teste e devolve a base da API. */
export function startExampleBackend(): { api: () => string } {
  let dir = '';
  let base = '';
  let close = () => {};
  beforeAll(async () => {
    // o jsdom não mede nada: as listas virtualizadas e os gráficos precisam de uma janela com tamanho
    globalThis.ResizeObserver ??= class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
    window.matchMedia ??= ((q: string) => ({
      matches: false,
      media: q,
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent: () => false
    })) as unknown as typeof window.matchMedia;
    dir = mkdtempSync(join(tmpdir(), 'engine-demo-'));
    // a raiz do repositório: o vitest roda na raiz
    const example = await exampleServer(join(dir, 'crm.db'), process.cwd());
    await new Promise<void>((resolve) => example.server.listen(0, '127.0.0.1', resolve));
    base = `http://127.0.0.1:${(example.server.address() as AddressInfo).port}/api`;
    close = example.close;
  });
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  afterAll(() => {
    close();
    rmSync(dir, { recursive: true, force: true });
  });
  return { api: () => base };
}

/** Abre a shell no endereço `path` já com a sessão do usuário (token = login, como no exemplo). */
export async function openShell(api: string, path: string, user: string | null = 'admin', extra: Partial<C3ShellProps> = {}) {
  window.history.replaceState(null, '', path);
  if (user) window.localStorage.setItem('c3.token', user);
  return render(<C3Shell apiUrl={api} auth={httpAuth(api)} theme={{ storageKey: 'c3-e2e' }} {...extra} />);
}

/** Entra pela tela de login. */
export async function login(identifier: string, password = 'c3') {
  fireEvent.change(await screen.findByLabelText(/Usuário/i), { target: { value: identifier } });
  fireEvent.change(screen.getByLabelText('Senha', { selector: 'input' }), { target: { value: password } });
  fireEvent.click(screen.getByRole('button', { name: /Entrar/i }));
  await waitFor(() => expect(screen.queryByRole('button', { name: /Entrar/i })).toBeNull(), { timeout: 5000 });
}

/** Pedido direto à API do exemplo (para preparar dados), como o usuário `user`. */
export async function apiCall(api: string, method: string, path: string, body?: unknown, user = 'admin') {
  const res = await fetch(api + path, {
    method,
    headers: { authorization: `Bearer ${user}`, 'c3-branch': '1', ...(body === undefined ? {} : { 'content-type': 'application/json' }) },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const json = (await res.json().catch(() => null)) as { data?: Record<string, unknown> } | null;
  if (!res.ok) throw new Error(`${method} ${path}: ${res.status} ${JSON.stringify(json)}`);
  return json?.data as Record<string, unknown>;
}

/** Etiqueta única por teste: o banco é o mesmo para o arquivo inteiro. */
export const tag = () => `t${Math.random().toString(36).slice(2, 7)}`;

/** Número de pedido que não repete no arquivo (`number` é único). */
let lastOrder = 1000;
export const orderNumber = () => ++lastOrder;
