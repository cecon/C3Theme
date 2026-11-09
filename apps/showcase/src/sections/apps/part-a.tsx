import { lazy } from 'react';
import { Navigate, redirect, type RouteObject } from 'react-router';

// third-party
import { Calendar1, Kanban, Magicpen, Messages2 } from 'iconsax-reactjs';

import { Loadable, type NavItem } from '@c3theme/ui';

const AssistentePage = Loadable(lazy(() => import('./assistente/AssistentePage')));
const ChatPage = Loadable(lazy(() => import('./chat/ChatPage')));
const KanbanLayout = Loadable(lazy(() => import('./kanban/KanbanLayout')));
const QuadroPage = Loadable(lazy(() => import('./kanban/quadro/QuadroPage')));
const BacklogPage = Loadable(lazy(() => import('./kanban/backlog/BacklogPage')));

// assistente, calendário, chat e kanban
export const items: NavItem[] = [
  { id: 'apps-assistente', title: 'Assistente', icon: Magicpen, url: '/apps/assistente' },
  // o calendário é a tela do motor (spec em sections/motor/spec/evento.json)
  { id: 'apps-calendario', title: 'Calendário', icon: Calendar1, url: '/evento/calendar' },
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
  // endereço antigo do calendário em código
  { path: 'apps/calendario', loader: () => redirect('/evento/calendar') },
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
