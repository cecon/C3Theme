// Roteador da shell. `browser` usa o caminho da URL (site servido por HTTP); `hash` usa o que vem depois do `#`,
// que é o que funciona com a página aberta de arquivo (Electron, `file://`), onde o caminho é o do index.html.

import { createBrowserRouter, createHashRouter, RouteObject } from 'react-router';

export type RouterMode = 'browser' | 'hash';

export function createShellRouter(mode: RouterMode, routes: RouteObject[], basename?: string) {
  return mode === 'hash' ? createHashRouter(routes, { basename }) : createBrowserRouter(routes, { basename });
}
