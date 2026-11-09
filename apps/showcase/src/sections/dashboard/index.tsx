import { lazy } from 'react';

// third-party
import { Home2, PresentionChart } from 'iconsax-reactjs';

import { Loadable } from '@c3theme/ui';
import type { Section } from '../../section';

const DefaultPage = Loadable(lazy(() => import('./DefaultPage')));
const AnalyticsPage = Loadable(lazy(() => import('./AnalyticsPage')));

export const section: Section = {
  menu: {
    id: 'dashboard',
    title: 'Painéis',
    items: [
      { id: 'dashboard-padrao', title: 'Padrão', icon: Home2, url: '/dashboard/padrao' },
      { id: 'dashboard-analitico', title: 'Analítico', icon: PresentionChart, url: '/dashboard/analitico' }
    ]
  },
  routes: [
    { path: 'dashboard/padrao', element: <DefaultPage /> },
    { path: 'dashboard/analitico', element: <AnalyticsPage /> }
  ]
};
