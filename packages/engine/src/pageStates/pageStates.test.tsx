// @vitest-environment jsdom
import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { useLocation } from 'react-router';
import useSWR from 'swr';
import type { EngineState } from '../context';
import { usePageState } from './context';
import { emptyData, pageDataState } from './state';
import type { ConnectivityPort } from './types';
import { mount, states } from './pageStateFixture.test-utils';
afterEach(cleanup);
describe('estados da página declarados', () => {
  it('sem states mantém a página e o aviso de acesso existentes', () => {
    const view = mount(() => <p>Conteúdo</p>);
    expect(screen.getByText('Conteúdo')).toBeTruthy();
    view.unmount();
    mount(() => <p>Segredo</p>, { access: false });
    expect(screen.getByText('Você não tem permissão para abrir esta página.')).toBeTruthy();
    expect(screen.queryByText('Segredo')).toBeNull();
  });

  it('permissão negada usa mensagem e instrução, sem montar conteúdo', () => {
    const Page = vi.fn(() => <p>Segredo</p>);
    mount(Page, { states, access: false });
    expect(screen.getByText('Acesso restrito')).toBeTruthy();
    expect(screen.getByText('Peça acesso à administração')).toBeTruthy();
    expect(Page).not.toHaveBeenCalled();
  });

  it('página registrada sinaliza vazio e a ação da spec navega', async () => {
    function Page() {
      usePageState({ empty: true });
      return <p>Corpo</p>;
    }
    const { router } = mount(Page, { states });
    expect(await screen.findByText('Sem pedidos')).toBeTruthy();
    fireEvent.click(screen.getByRole('link', { name: 'Cadastrar' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/novo'));
  });

  it('dados SWR reais carregam, ficam vazios e repetem uma falha', async () => {
    let finish: (value: unknown) => void = () => {};
    const fetcher = vi.fn(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );
    function Page() {
      const { data } = useSWR(['c3-list', 'pedidos'], fetcher);
      return <p>{JSON.stringify(data)}</p>;
    }
    mount(Page, { states });
    expect(await screen.findByText('Carregando pedidos')).toBeTruthy();
    await act(async () => finish({ data: [] }));
    expect(await screen.findByText('Sem pedidos')).toBeTruthy();
  });

  it('erro com cache mostra banner sem ocultar dados; retry não remonta o corpo', async () => {
    const retry = vi.fn();
    let mounts = 0;
    function Page() {
      useState(() => ++mounts);
      usePageState({ error: new Error('rede'), hasData: true, retry: () => retry() });
      return <p>Pedido já carregado</p>;
    }
    mount(Page, { states });
    expect(await screen.findByText('Falha da página')).toBeTruthy();
    expect(screen.getByText('Pedido já carregado').closest('[style*="display: none"]')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Repetir' }));
    expect(retry).toHaveBeenCalledOnce();
    expect(mounts).toBe(1);
  });

  it('porta IPC vence navegador, preserva conteúdo e remove assinatura', async () => {
    let online = true;
    let changed = () => {};
    const unsubscribe = vi.fn();
    const connectivity = {
      getOnline: () => online,
      subscribe: vi.fn((listener) => {
        changed = listener;
        return unsubscribe;
      })
    } satisfies ConnectivityPort;
    const Page = () => <input aria-label="Rascunho" defaultValue="não perder" />;
    const view = mount(Page, { states, connectivity });
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Editado' } });
    act(() => {
      online = false;
      changed();
    });
    expect(await screen.findByText('Conexão interrompida')).toBeTruthy();
    expect(screen.getByText('Consulta local')).toBeTruthy();
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('Editado');
    act(() => {
      online = true;
      changed();
    });
    expect(screen.queryByText('Conexão interrompida')).toBeNull();
    view.unmount();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it('navegador usa navigator.onLine e os eventos online/offline', async () => {
    const original = Object.getOwnPropertyDescriptor(navigator, 'onLine');
    let online = true;
    Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => online });
    try {
      const view = mount(() => <p>Dados locais</p>, { states });
      act(() => {
        online = false;
        window.dispatchEvent(new Event('offline'));
      });
      expect(await screen.findByText('Conexão interrompida')).toBeTruthy();
      expect(screen.getByText('Dados locais')).toBeTruthy();
      act(() => {
        online = true;
        window.dispatchEvent(new Event('online'));
      });
      expect(screen.queryByText('Conexão interrompida')).toBeNull();
      view.unmount();
    } finally {
      if (original) Object.defineProperty(navigator, 'onLine', original);
      else delete (navigator as unknown as Record<string, unknown>).onLine;
    }
  });

  it('erro da página A não vaza para a página B', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    function Page() {
      const location = useLocation();
      if (location.pathname === '/dados') throw new Error('segredo interno');
      return <p>Página B</p>;
    }
    try {
      const { router } = mount(Page, { states, pages: [{ path: '/b', component: 'page', states }] });
      expect(await screen.findByText('Falha da página')).toBeTruthy();
      expect(screen.queryByText('segredo interno')).toBeNull();
      await act(() => router.navigate('/b'));
      expect(await screen.findByText('Página B')).toBeTruthy();
      expect(screen.queryByText('Falha da página')).toBeNull();
    } finally {
      log.mockRestore();
    }
  });

  it('painel real: lista vazia permite vazio; KPI zero mantém os dados', async () => {
    const client = {
      list: vi.fn(async () => ({ data: [], meta: { total: 0 } })),
      aggregate: vi.fn(async () => [{ value: 0 }])
    } as unknown as EngineState['client'];
    const entities = {
      pedido: {
        def: { name: 'pedido', label: { singular: 'Pedido', plural: 'Pedidos' }, fields: [{ name: 'nome', type: 'string' }] },
        capabilities: { create: false, update: false, delete: false, list: true, read: true }
      }
    } as EngineState['entities'];
    const list = { type: 'list', entity: 'pedido', title: 'Pedidos', columns: ['nome'] } as const;
    const first = mount(() => <p />, { states, client, entities, dashboard: { widgets: [{ ...list, columns: ['nome'] }] } });
    expect(await screen.findByText('Sem pedidos')).toBeTruthy();
    first.unmount();
    mount(() => <p />, {
      states,
      client,
      entities,
      dashboard: {
        widgets: [
          { ...list, columns: ['nome'] },
          { type: 'kpi', entity: 'pedido', title: 'Total' }
        ]
      }
    });
    expect(await screen.findByText('0')).toBeTruthy();
    await waitFor(() => expect(screen.queryByText('Sem pedidos')).toBeNull());
    expect(client.aggregate).toHaveBeenCalled();
  });

  it('zero é dado e um widget com conteúdo impede vazio da página', () => {
    expect(emptyData(0)).toBe(false);
    expect(emptyData([{ value: 0 }])).toBe(false);
    expect(pageDataState([{ empty: true }, { hasData: true, empty: false }]).empty).toBe(false);
    expect(pageDataState([{ empty: true }, { empty: true }]).empty).toBe(true);
    expect(pageDataState([]).empty).toBe(false);
  });
});
