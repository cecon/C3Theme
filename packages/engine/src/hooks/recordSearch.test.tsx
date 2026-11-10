// @vitest-environment jsdom
// Ctrl K com registros (#24): o cliente chama GET /_search e o hook só liga com `records: true`.
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { createClient, type C3Client } from '../api';
import { EngineProvider } from '../context';
import type { AppDef } from '../types';
import useRecordSearch from './useRecordSearch';

const hit = { kind: 'produto', group: 'Produtos', title: 'Pão', snippet: null, path: '/produto/1', icon: 'Box', at: null };

describe('GET /_search', () => {
  it('manda q e limit e repassa o signal', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ data: [hit] }), { headers: { 'content-type': 'application/json' } }));
    const ctl = new AbortController();
    const data = await createClient('/api/', undefined, undefined, fetch).search!('pão de', 20, ctl.signal);
    expect(data).toEqual([hit]);
    expect(fetch.mock.calls[0][0]).toBe('/api/_search?q=p%C3%A3o+de&limit=20');
    expect(fetch.mock.calls[0][1].signal).toBe(ctl.signal);
  });
});

function hook(search: boolean | { records?: boolean } | undefined, client: Partial<C3Client>) {
  const app = { name: 'demo', entities: [], layout: { menu: [], header: { search } } } as unknown as AppDef;
  const Icon = ({ size }: { size: number }) => <i data-size={size} />;
  const wrapper = ({ children }: { children: ReactNode }) => (
    <EngineProvider value={{ client: client as C3Client, app, entities: {}, icons: { Box: Icon } } as never}>{children}</EngineProvider>
  );
  return renderHook(() => useRecordSearch(), { wrapper }).result.current;
}

describe('useRecordSearch', () => {
  it('desligado com true, ausente ou sem client.search', () => {
    expect(hook(true, { search: vi.fn() })).toBeUndefined();
    expect(hook(undefined, { search: vi.fn() })).toBeUndefined();
    expect(hook({ records: true }, {})).toBeUndefined();
  });

  it('com records, chama o cliente e troca o nome do ícone pelo componente', async () => {
    const search = vi.fn().mockResolvedValue([hit, { ...hit, icon: 'Nada', path: '/produto/2' }]);
    const run = hook({ records: true }, { search })!;
    const signal = new AbortController().signal;
    const out = await run('pao', signal);
    expect(search).toHaveBeenCalledWith('pao', 20, signal);
    expect(out[0]).toMatchObject({ group: 'Produtos', title: 'Pão', path: '/produto/1' });
    expect(out[0].icon).toBeTruthy();
    expect(out[1].icon).toBeUndefined();
  });
});
