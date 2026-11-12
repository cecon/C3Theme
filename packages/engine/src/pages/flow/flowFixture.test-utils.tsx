// Montagem comum dos testes do editor de fluxo pela spec (#72): a entidade, os grafos, o cliente de mentira, o editor
// de mentira (o canvas de verdade não roda no jsdom) e o motor em volta.
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter, Route, Routes } from 'react-router';
import { SWRConfig } from 'swr';
import { vi } from 'vitest';

import type { FlowEditorProps, FlowGraph } from '@c3theme/flow';

import type { C3Client } from '../../api';
import { EngineProvider } from '../../context';
import type { EntityDef, WireRecord } from '../../types';

/** O que o editor recebeu na última renderização. */
export const editor = { props: undefined as unknown as FlowEditorProps };

export function FakeEditor(props: FlowEditorProps) {
  editor.props = props;
  return <p>{`${props.value.nodes.length} passos no editor`}</p>;
}

export const automacao = {
  name: 'automacao',
  label: { singular: 'Automação', plural: 'Automações' },
  titleField: 'nome',
  fields: [
    { name: 'nome', type: 'string', label: 'Nome' },
    { name: 'grafo', type: 'text', label: 'Passos' }
  ],
  views: {
    flow: {
      field: 'grafo',
      title: 'Passos da automação',
      kinds: [
        { type: 'gatilho', label: 'Gatilho', icon: 'Flash', input: false },
        { type: 'fim', label: 'Fim', outputs: [] }
      ]
    }
  }
} as unknown as EntityDef;

export const node = (id: string, type: string) => ({ id, type, position: { x: 0, y: 0 } });
export const VALID: FlowGraph = {
  nodes: [node('a', 'gatilho'), node('b', 'fim')],
  edges: [{ id: 'e', source: 'a', sourcePort: 'out', target: 'b' }]
};
export const SAVED: FlowGraph = { nodes: [node('a', 'gatilho')], edges: [] };

export const record = (grafo: unknown = JSON.stringify(SAVED)): WireRecord => ({
  id: '7',
  nome: 'Pedido pelo WhatsApp',
  grafo,
  _version: 'v1'
});

export type FakeClient = C3Client & { get: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };

export function fakeClient(rec: WireRecord, update?: C3Client['update']): FakeClient {
  return {
    get: vi.fn(async () => rec),
    update: vi.fn(update ?? (async (_e: string, _id: string, patch: WireRecord) => ({ ...rec, ...patch, _version: 'v2' })))
  } as unknown as FakeClient;
}

export interface MountOptions {
  def?: EntityDef;
  update?: boolean;
  path?: string;
  /** Cache do SWR, para o teste ver o que a tela gravou nele (ou já começar com o registro). */
  cache?: Map<string, unknown>;
}

export function mount(client: C3Client, ui: ReactNode, opts: MountOptions = {}) {
  const def = opts.def ?? automacao;
  const value = {
    client,
    app: { name: 'x', entities: ['automacao'], layout: { menu: [] } },
    entities: { automacao: { def, capabilities: { read: true, update: opts.update ?? true } } },
    components: {},
    icons: { Flash: (p: { variant?: string }) => <svg data-variant={p.variant} /> }
  } as never;
  const cache = opts.cache ?? new Map();
  return render(
    <IntlProvider locale="pt-BR" onError={() => {}}>
      <SWRConfig value={{ provider: () => cache as never }}>
        <EngineProvider value={value}>
          <MemoryRouter initialEntries={[opts.path ?? '/automacao/7/flow']}>
            <Routes>
              <Route path="/automacao/:id/flow" element={ui} />
              <Route path="/automacao/:id" element={<p>formulário</p>} />
            </Routes>
          </MemoryRouter>
        </EngineProvider>
      </SWRConfig>
    </IntlProvider>
  );
}
