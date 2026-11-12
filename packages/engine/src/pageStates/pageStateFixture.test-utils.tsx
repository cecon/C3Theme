import { render } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { ThemeProvider } from '@mui/material/styles';
import { createC3Theme } from '@c3theme/ui';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router';
import { SWRConfig } from 'swr';
import { EngineProvider, type EngineState } from '../context';
import { buildRoutes } from '../routes';
import type { AppDef, PageDef } from '../types';
import type { DashboardDef } from '../dashboard';
import type { ConnectivityPort, PageStates } from './types';
import '../pages/dashboard/Dashboard';
export const states: PageStates = {
  loading: { message: { id: 'loading' } },
  empty: { message: 'Sem pedidos', action: { label: 'Cadastrar', path: '/novo' } },
  error: { message: 'Falha da página', action: { label: 'Repetir', retry: true } },
  forbidden: { message: 'Acesso restrito', instruction: 'Peça acesso à administração' },
  offline: { message: 'Conexão interrompida', works: ['Consulta local'] }
};
export function mount(
  Page: () => React.JSX.Element,
  options: {
    states?: PageStates;
    access?: boolean;
    connectivity?: ConnectivityPort;
    dashboard?: DashboardDef;
    entities?: EngineState['entities'];
    client?: EngineState['client'];
    pages?: PageDef[];
  } = {}
) {
  const app = {
    name: 'App',
    entities: [],
    layout: { menu: [] },
    pages: [
      { path: '/dados', ...(options.dashboard ? { dashboard: options.dashboard } : { component: 'page' }), states: options.states },
      ...(options.pages ?? [])
    ]
  } as AppDef;
  const value = {
    app,
    client: options.client,
    entities: options.entities ?? {},
    components: { page: Page },
    pageAccess: { '/dados': options.access ?? true },
    connectivity: options.connectivity
  } as EngineState;
  const router = createMemoryRouter(buildRoutes(app, <Outlet />, [{ path: '/novo', element: <p>Novo pedido</p> }]), {
    initialEntries: ['/dados']
  });
  const view = render(
    <IntlProvider locale="pt-BR" onError={() => {}} messages={{ loading: 'Carregando pedidos' }}>
      <ThemeProvider theme={createC3Theme({})}>
        <SWRConfig value={{ provider: () => new Map(), shouldRetryOnError: false }}>
          <EngineProvider value={value}>
            <RouterProvider router={router} />
          </EngineProvider>
        </SWRConfig>
      </ThemeProvider>
    </IntlProvider>
  );
  return { ...view, router };
}
