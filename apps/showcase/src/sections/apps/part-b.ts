import { lazy } from 'react';
import { redirect } from 'react-router';
import type { RouteObject } from 'react-router';

// third-party
import { Profile2User, ShoppingBag } from 'iconsax-reactjs';

import { Loadable } from '@c3theme/ui';
import type { NavItem } from '@c3theme/ui';

// clientes e loja: cada um tem uma rota-mãe que guarda os dados em memória (contexto) para as telas filhas
const ClientesLayout = Loadable(lazy(() => import('./clientes/store')));
const ClientesCartoes = Loadable(lazy(() => import('./clientes/CardsPage')));

const LojaLayout = Loadable(lazy(() => import('./loja/store')));
const LojaProdutos = Loadable(lazy(() => import('./loja/ProductsPage')));
const LojaProduto = Loadable(lazy(() => import('./loja/ProductDetailPage')));
const LojaLista = Loadable(lazy(() => import('./loja/ProductListPage')));
const LojaNovoProduto = Loadable(lazy(() => import('./loja/NewProductPage')));
const LojaCheckout = Loadable(lazy(() => import('./loja/CheckoutPage')));

export const items: NavItem[] = [
  {
    id: 'apps-clientes',
    title: 'Clientes',
    icon: Profile2User,
    children: [
      // a lista é a tela do motor (spec em sections/motor/spec/cliente.json)
      { id: 'apps-clientes-lista', title: 'Lista de clientes', url: '/cliente' },
      { id: 'apps-clientes-cartoes', title: 'Cartões de clientes', url: '/apps/clientes/cartoes' }
    ]
  },
  {
    id: 'apps-loja',
    title: 'E-commerce',
    icon: ShoppingBag,
    children: [
      { id: 'apps-loja-produtos', title: 'Produtos', url: '/apps/loja/produtos' },
      { id: 'apps-loja-lista', title: 'Lista de produtos', url: '/apps/loja/lista' },
      { id: 'apps-loja-novo', title: 'Novo produto', url: '/apps/loja/novo-produto' },
      { id: 'apps-loja-checkout', title: 'Checkout', url: '/apps/loja/checkout' }
    ]
  }
];

export const routes: RouteObject[] = [
  {
    path: 'apps/clientes',
    Component: ClientesLayout,
    children: [
      // endereço antigo da lista em código
      { path: 'lista', loader: () => redirect('/cliente') },
      { path: 'cartoes', Component: ClientesCartoes }
    ]
  },
  {
    path: 'apps/loja',
    Component: LojaLayout,
    children: [
      { path: 'produtos', Component: LojaProdutos },
      { path: 'produtos/:id', Component: LojaProduto },
      { path: 'lista', Component: LojaLista },
      { path: 'novo-produto', Component: LojaNovoProduto },
      { path: 'checkout', Component: LojaCheckout }
    ]
  }
];
