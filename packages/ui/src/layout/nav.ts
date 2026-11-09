import { ElementType, ReactNode, createContext, useContext } from 'react';

export interface NavItem {
  id: string;
  /** Texto do item; também é o que a busca do header procura. */
  title: string;
  /** Componente de ícone (ex.: um ícone do iconsax-reactjs). Recebe `size` e `variant`. */
  icon?: ElementType;
  /** Rota interna (pode ter query, ex.: `/customer?preset=ativos`) ou URL externa. */
  url?: string;
  external?: boolean;
  /** Contador ao lado do título (ex.: tamanho de uma fila de pendências). */
  badge?: ReactNode;
  children?: NavItem[];
}

export interface NavGroup {
  id: string;
  title?: ReactNode;
  items: NavItem[];
}

export const NavContext = createContext<NavGroup[]>([]);
export const useNav = () => useContext(NavContext);

/** Todos os itens com link, achatados, com o caminho de títulos até eles (para a busca). */
export function flattenNav(groups: NavGroup[]): { item: NavItem; trail: string[] }[] {
  const out: { item: NavItem; trail: string[] }[] = [];
  const walk = (items: NavItem[], trail: string[]) => {
    for (const item of items) {
      if (item.url) out.push({ item, trail });
      if (item.children) walk(item.children, [...trail, item.title]);
    }
  };
  for (const g of groups) walk(g.items, typeof g.title === 'string' ? [g.title] : []);
  return out;
}

/**
 * Qual item está ativo para a URL atual. Vence o item cuja rota bate e que tem mais parâmetros de query
 * iguais: em `/customer?preset=vip`, o item "VIPs" ganha de "Clientes" (`/customer`).
 */
export function activeItemId(groups: NavGroup[], pathname: string, search: string): string | undefined {
  const current = new URLSearchParams(search);
  let best: { id: string; score: number } | undefined;
  for (const { item } of flattenNav(groups)) {
    if (item.external || !item.url) continue;
    const [path, query = ''] = item.url.split('?');
    const samePath = pathname === path || (path !== '/' && pathname.startsWith(path + '/'));
    if (!samePath) continue;
    const params = [...new URLSearchParams(query)];
    if (!params.every(([k, v]) => current.get(k) === v)) continue;
    const score = (pathname === path ? 1000 : path.length) + params.length;
    if (!best || score > best.score) best = { id: item.id, score };
  }
  return best?.id;
}

export function containsId(item: NavItem, id: string | undefined): boolean {
  return !!id && (item.id === id || !!item.children?.some((c) => containsId(c, id)));
}

/** Caminho de itens do menu até o item ativo (para breadcrumbs). */
export function activeTrail(groups: NavGroup[], pathname: string, search: string): { group?: NavGroup; items: NavItem[] } {
  const id = activeItemId(groups, pathname, search);
  if (!id) return { items: [] };
  const find = (items: NavItem[], trail: NavItem[]): NavItem[] | undefined => {
    for (const item of items) {
      const next = [...trail, item];
      if (item.id === id) return next;
      const hit = item.children && find(item.children, next);
      if (hit) return hit;
    }
  };
  for (const group of groups) {
    const items = find(group.items, []);
    if (items) return { group, items };
  }
  return { items: [] };
}
