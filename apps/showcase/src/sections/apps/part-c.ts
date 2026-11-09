import { lazy } from 'react';
import { redirect } from 'react-router';
import type { RouteObject } from 'react-router';

// third-party
import { ProfileCircle, ReceiptText } from 'iconsax-reactjs';

import { Loadable } from '@c3theme/ui';
import type { NavItem } from '@c3theme/ui';

// faturas e perfis
const InvoiceForm = Loadable(lazy(() => import('./faturas/Formulario')));
const InvoiceDetails = Loadable(lazy(() => import('./faturas/Detalhes')));
const UserProfile = Loadable(lazy(() => import('./perfil/Usuario')));
const AccountSettings = Loadable(lazy(() => import('./perfil/Conta')));

export const items: NavItem[] = [
  {
    id: 'faturas',
    title: 'Faturas',
    icon: ReceiptText,
    children: [
      // o painel e a lista são telas do motor (specs em sections/motor/spec: app.json e fatura.json)
      { id: 'faturas-painel', title: 'Painel de faturas', url: '/apps/faturas/painel' },
      { id: 'faturas-lista', title: 'Lista de faturas', url: '/fatura' },
      { id: 'faturas-nova', title: 'Nova fatura', url: '/apps/faturas/nova' }
    ]
  },
  {
    id: 'perfil',
    title: 'Perfil',
    icon: ProfileCircle,
    children: [
      { id: 'perfil-usuario', title: 'Perfil do usuário', url: '/apps/perfil/usuario' },
      { id: 'perfil-conta', title: 'Configurações da conta', url: '/apps/perfil/conta' }
    ]
  }
];

// `nova` e `lista` vêm antes de `:id` só por clareza: o React Router já prioriza caminhos fixos
export const routes: RouteObject[] = [
  // endereço antigo do painel por JSON
  { path: 'motor/painel', loader: () => redirect('/apps/faturas/painel') },
  // endereço antigo da lista em código
  { path: 'apps/faturas/lista', loader: () => redirect('/fatura') },
  { path: 'apps/faturas/nova', Component: InvoiceForm },
  { path: 'apps/faturas/:id', Component: InvoiceDetails },
  { path: 'apps/faturas/:id/editar', Component: InvoiceForm },
  { path: 'apps/perfil/usuario', Component: UserProfile },
  { path: 'apps/perfil/conta', Component: AccountSettings }
];
