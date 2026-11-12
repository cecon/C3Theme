// @vitest-environment jsdom
// A rota /{entity}/:id/flow que a shell monta para toda entidade (#72): carrega o editor só quando abre.
import { cleanup, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router';
import { SWRConfig } from 'swr';
import { afterEach, expect, it, vi } from 'vitest';

import type { FlowEditorProps } from '@c3theme/flow';

import { EngineProvider } from '../../context';
import { buildRoutes } from '../../routes';
import type { AppDef, EntityDef } from '../../types';

vi.mock('@c3theme/flow', () => ({
  FlowEditor: (props: FlowEditorProps) => <p>{`editor com ${props.value.nodes.length} passos`}</p>
}));

afterEach(cleanup);

it('/{entity}/:id/flow abre o editor do registro, carregado à parte', async () => {
  const def = {
    name: 'automacao',
    label: { singular: 'Automação', plural: 'Automações' },
    fields: [{ name: 'grafo', type: 'text' }],
    views: { flow: { field: 'grafo', kinds: [{ type: 'fim', label: 'Fim', outputs: [] }] } }
  } as unknown as EntityDef;
  const app = { name: 'x', entities: ['automacao'], layout: { menu: [] } } as unknown as AppDef;
  const graph = { nodes: [{ id: 'f', type: 'fim', position: { x: 0, y: 0 } }], edges: [] };
  const client = { get: vi.fn(async (_e: string, id: string) => ({ id, grafo: JSON.stringify(graph) })) };
  const router = createMemoryRouter(buildRoutes(app, <Outlet />), { initialEntries: ['/automacao/7/flow'] });
  const value = { client, app, entities: { automacao: { def, capabilities: { update: true } } }, components: {} } as never;
  render(
    <IntlProvider locale="pt-BR" onError={() => {}}>
      <SWRConfig value={{ provider: () => new Map() }}>
        <EngineProvider value={value}>
          <RouterProvider router={router} />
        </EngineProvider>
      </SWRConfig>
    </IntlProvider>
  );
  expect(await screen.findByText('editor com 1 passos')).toBeTruthy();
  expect(client.get).toHaveBeenCalledWith('automacao', '7');
  const match = router.routes[0].children!.find((r) => r.path === 'automacao/:id/flow');
  expect(match).toBeTruthy();
});
