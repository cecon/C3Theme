import { lazy } from 'react';

// third-party
import { Graph, Hierarchy, Map1 } from 'iconsax-reactjs';

import { Loadable } from '@c3theme/ui';
import type { Section } from '../../section';

const Charts = Loadable(lazy(() => import('./charts/ChartsPage')));
const OrgChart = Loadable(lazy(() => import('./org/OrgChartPage')));
const MapPage = Loadable(lazy(() => import('./map/MapPage')));

export const section: Section = {
  menu: {
    id: 'charts',
    title: 'Gráficos e mapa',
    items: [
      { id: 'charts-types', title: 'Gráficos', icon: Graph, url: '/graficos/tipos' },
      { id: 'charts-org', title: 'Organograma', icon: Hierarchy, url: '/graficos/organograma' },
      { id: 'charts-map', title: 'Mapa', icon: Map1, url: '/graficos/mapa' }
    ]
  },
  routes: [
    { path: 'graficos/tipos', element: <Charts /> },
    { path: 'graficos/organograma', element: <OrgChart /> },
    { path: 'graficos/mapa', element: <MapPage /> }
  ]
};
