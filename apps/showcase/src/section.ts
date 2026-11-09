import type { RouteObject } from 'react-router';

import type { NavGroup } from '@c3theme/ui';

/**
 * Uma área da vitrine: o grupo de menu e as rotas.
 * `routes` ficam dentro do layout (menu + header); `fullScreenRoutes` ficam fora (login, landing, erro).
 * Os caminhos são relativos à raiz, sem barra inicial (ex.: 'dashboard/padrao').
 */
export interface Section {
  menu: NavGroup;
  routes: RouteObject[];
  fullScreenRoutes?: RouteObject[];
}
