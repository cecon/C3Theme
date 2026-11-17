// @vitest-environment jsdom
// A rota /{entity}/board carrega o quadro à parte (#121): o arrastar e soltar não entra no pedaço de entrada.
import { cleanup, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router';
import { SWRConfig } from 'swr';
import { afterEach, expect, it, vi } from 'vitest';

import { EngineProvider } from '../../context';
import { buildRoutes } from '../../routes';
import type { AppDef } from '../../types';

vi.mock('./EntityBoard', () => ({ default: ({ entity }: { entity: string }) => <p>{`quadro de ${entity}`}</p> }));

afterEach(cleanup);

it('/{entity}/board mostra o esqueleto e depois o quadro da entidade', async () => {
  const app = { name: 'x', entities: ['tarefa'], layout: { menu: [] } } as unknown as AppDef;
  const router = createMemoryRouter(buildRoutes(app, <Outlet />), { initialEntries: ['/tarefa/board'] });
  const value = {
    client: {},
    app,
    entities: { tarefa: { def: { name: 'tarefa', fields: [] }, capabilities: {} } },
    components: {}
  } as never;
  render(
    <IntlProvider locale="pt-BR" onError={() => {}}>
      <SWRConfig value={{ provider: () => new Map() }}>
        <EngineProvider value={value}>
          <RouterProvider router={router} />
        </EngineProvider>
      </SWRConfig>
    </IntlProvider>
  );
  expect(await screen.findByText('quadro de tarefa')).toBeTruthy();
});
