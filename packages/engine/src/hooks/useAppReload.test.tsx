// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { C3Client } from '../api';
import type { EngineState } from '../context';
import { routesKey } from '../routes';
import type { AppDef } from '../types';
import useAppReload from './useAppReload';

const app = (items: string[]) =>
  ({ name: 'p', entities: [], layout: { menu: [{ items: items.map((title) => ({ title, path: '/x' })) }] } }) as unknown as AppDef;

function fakeClient(next: AppDef) {
  return { meta: vi.fn(async () => ({ app: next, pageAccess: { '/x': true } })), entity: vi.fn() } as unknown as C3Client;
}

describe('recarregar o app sem remontar (#163)', () => {
  it('atualiza o status sem pedir entidades indisponíveis e retoma a carga quando o status sai', async () => {
    const next = { ...app([]), entities: ['nota'], status: { mode: 'maintenance' as const, message: 'Atualizando' } };
    const client = fakeClient(next);
    vi.mocked(client.entity).mockRejectedValue(new Error('503: entidade indisponível'));
    let state: EngineState | undefined = { app: app([]) } as EngineState;
    const setState = vi.fn((f: (s: EngineState | undefined) => EngineState | undefined) => (state = f(state)));
    const { result } = renderHook(() => useAppReload(client, setState as never, 1));
    await act(async () => result.current());
    expect(state!.app.status).toEqual(next.status);
    expect(state!.entities).toEqual({});
    expect(client.entity).not.toHaveBeenCalled();
    vi.mocked(client.meta).mockResolvedValue({ app: app([]), pageAccess: {} });
    await act(async () => result.current());
    expect(state!.app.status).toBeUndefined();
  });
  it('só lê de novo quando a versão muda, e troca o app no estado', async () => {
    const client = fakeClient(app(['Atendente', 'Financeiro']));
    let state: EngineState | undefined = { app: app(['Atendente']) } as EngineState;
    const setState = vi.fn((f: (s: EngineState | undefined) => EngineState | undefined) => (state = f(state)));
    const { rerender } = renderHook(({ v }) => useAppReload(client, setState as never, v), { initialProps: { v: 1 } });
    expect(client.meta).not.toHaveBeenCalled();
    await act(async () => rerender({ v: 2 }));
    expect(client.meta).toHaveBeenCalledTimes(1);
    expect(state!.app.layout.menu[0]!.items.map((i) => i.title)).toEqual(['Atendente', 'Financeiro']);
    expect(state!.pageAccess).toEqual({ '/x': true });
  });

  it('menu diferente não muda as rotas; página nova muda', () => {
    expect(routesKey(app(['A']))).toBe(routesKey(app(['A', 'B'])));
    expect(routesKey(app(['A']))).not.toBe(routesKey({ ...app(['A']), pages: [{ path: '/conversa/:id', component: 'x' }] } as AppDef));
  });
});
