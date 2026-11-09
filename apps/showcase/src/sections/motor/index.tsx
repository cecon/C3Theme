// "Por JSON": telas de negócio montadas pelo @c3theme/engine a partir das specs em ./spec, com os dados num
// adaptador em memória (o Pages não tem backend). As rotas da entidade ficam na raiz (/pessoa, /pessoa/12), como
// o motor navega; os nomes das entidades não colidem com as áreas da vitrine.

import { ComponentType, lazy } from 'react';
import type { RouteObject } from 'react-router';

// third-party
import { Calendar1, Kanban, ReceiptText, UserSquare } from 'iconsax-reactjs';

import { Loadable } from '@c3theme/ui';
import type { Section } from '../../section';
import { APP } from './spec';

// o motor (gráficos, arrastar, formulários) só baixa quando alguém abre uma tela "Por JSON"
type ScreenName = 'ListScreen' | 'NewScreen' | 'BoardScreen' | 'CalendarScreen' | 'RecordScreen' | 'DashboardScreen';
const screen = (name: ScreenName) =>
  Loadable(lazy(() => import('./screens').then((m) => ({ default: m[name] as ComponentType<{ entity?: string }> }))));

const MotorLayout = Loadable(lazy(() => import('./MotorLayout')));
const ListScreen = screen('ListScreen');
const NewScreen = screen('NewScreen');
const BoardScreen = screen('BoardScreen');
const CalendarScreen = screen('CalendarScreen');
const RecordScreen = screen('RecordScreen');
const DashboardScreen = screen('DashboardScreen');

const entityRoutes = (entity: string): RouteObject[] => [
  { path: entity, element: <ListScreen entity={entity} /> },
  { path: `${entity}/new`, element: <NewScreen entity={entity} /> },
  { path: `${entity}/board`, element: <BoardScreen entity={entity} /> },
  { path: `${entity}/calendar`, element: <CalendarScreen entity={entity} /> },
  { path: `${entity}/:id`, element: <RecordScreen entity={entity} /> }
];

export const section: Section = {
  menu: {
    id: 'motor',
    title: 'Por JSON',
    items: [
      { id: 'motor-pessoas', title: 'Pessoas', icon: UserSquare, url: '/pessoa' },
      { id: 'motor-faturas-nova', title: 'Nova fatura', icon: ReceiptText, url: '/fatura/new' },
      { id: 'motor-quadro', title: 'Quadro', icon: Kanban, url: '/tarefa/board' },
      { id: 'motor-calendario', title: 'Calendário', icon: Calendar1, url: '/evento/calendar' }
    ]
  },
  routes: [
    {
      element: <MotorLayout />,
      // o painel de faturas (menu Aplicativos > Faturas) é a página do app.json
      children: [{ path: 'apps/faturas/painel', element: <DashboardScreen /> }, ...APP.entities.flatMap(entityRoutes)]
    }
  ]
};
