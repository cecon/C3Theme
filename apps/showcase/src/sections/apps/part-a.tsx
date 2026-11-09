import { lazy } from 'react';
import { Navigate, type RouteObject } from 'react-router';

// third-party
import { Calendar1, Kanban, Magicpen, Messages2 } from 'iconsax-reactjs';

import { Loadable, type NavItem } from '@c3theme/ui';

const AssistentePage = Loadable(lazy(() => import('./assistente/AssistentePage')));
const CalendarioPage = Loadable(lazy(() => import('./calendario/CalendarioPage')));
const ChatPage = Loadable(lazy(() => import('./chat/ChatPage')));
const KanbanLayout = Loadable(lazy(() => import('./kanban/KanbanLayout')));
const QuadroPage = Loadable(lazy(() => import('./kanban/quadro/QuadroPage')));
const BacklogPage = Loadable(lazy(() => import('./kanban/backlog/BacklogPage')));

// assistente, calendário, chat e kanban
export const items: NavItem[] = [
  { id: 'apps-assistente', title: 'Assistente', icon: Magicpen, url: '/apps/assistente' },
  { id: 'apps-calendario', title: 'Calendário', icon: Calendar1, url: '/apps/calendario' },
  { id: 'apps-chat', title: 'Chat', icon: Messages2, url: '/apps/chat' },
  {
    id: 'apps-kanban',
    title: 'Kanban',
    icon: Kanban,
    children: [
      { id: 'apps-kanban-quadro', title: 'Quadro', url: '/apps/kanban/quadro' },
      { id: 'apps-kanban-backlog', title: 'Backlog', url: '/apps/kanban/backlog' }
    ]
  }
];

export const routes: RouteObject[] = [
  { path: 'apps/assistente', element: <AssistentePage /> },
  { path: 'apps/calendario', element: <CalendarioPage /> },
  { path: 'apps/chat', element: <ChatPage /> },
  {
    // o layout guarda o estado do kanban, compartilhado entre quadro e backlog
    path: 'apps/kanban',
    element: <KanbanLayout />,
    children: [
      { index: true, element: <Navigate to="quadro" replace /> },
      { path: 'quadro', element: <QuadroPage /> },
      { path: 'backlog', element: <BacklogPage /> }
    ]
  }
];
