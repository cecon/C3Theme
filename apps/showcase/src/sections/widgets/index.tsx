import { lazy } from 'react';

// third-party
import { Chart21, Element3, Graph } from 'iconsax-reactjs';

import { Loadable } from '@c3theme/ui';
import type { Section } from '../../section';

const StatisticsPage = Loadable(lazy(() => import('./StatisticsPage')));
const DataPage = Loadable(lazy(() => import('./DataPage')));
const ChartsPage = Loadable(lazy(() => import('./ChartsPage')));

export const section: Section = {
  menu: {
    id: 'widgets',
    title: 'Widgets',
    items: [
      { id: 'widgets-estatisticas', title: 'Estatísticas', icon: Graph, url: '/widgets/estatisticas' },
      { id: 'widgets-dados', title: 'Dados', icon: Element3, url: '/widgets/dados' },
      { id: 'widgets-graficos', title: 'Gráficos', icon: Chart21, url: '/widgets/graficos' }
    ]
  },
  routes: [
    { path: 'widgets/estatisticas', element: <StatisticsPage /> },
    { path: 'widgets/dados', element: <DataPage /> },
    { path: 'widgets/graficos', element: <ChartsPage /> }
  ]
};
