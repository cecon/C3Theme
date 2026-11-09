import { ReactNode } from 'react';

import { NavGroup, NavItem, activeItemId, activeTrail, containsId, flattenNav } from './nav';

/** Uma tela para onde o nível sem rota própria leva (as telas do grupo). */
export interface CrumbOption {
  title: string;
  to: string;
  /** A tela atual: aparece marcada na lista. */
  current?: boolean;
}

export interface Crumb {
  title: ReactNode;
  /** Rota do nível; sem ela o nível é texto ou, com `options`, abre a lista de telas do grupo. */
  to?: string;
  options?: CrumbOption[];
}

/** Primeira tela interna com rota no item ou dentro dele. */
function firstScreen(item: NavItem): string | undefined {
  return flattenNav([{ id: '', items: [item] }]).find(({ item: i }) => i.url && !i.external)?.item.url;
}

/**
 * Um nível abaixo, para a lista não virar o menu inteiro: cada item leva à própria tela ou, se for um
 * subgrupo, à primeira tela dele. Marca o que contém a tela atual.
 */
function screensOf(items: NavItem[], activeId: string | undefined): CrumbOption[] {
  return items.flatMap((item) => {
    const to = item.external ? undefined : firstScreen(item);
    return to ? [{ title: item.title, to, current: containsId(item, activeId) }] : [];
  });
}

/** Só vale abrir uma lista quando há outra tela além da atual para escolher. */
function withOptions(options: CrumbOption[]): CrumbOption[] | undefined {
  return options.filter((o) => !o.current).length ? options : undefined;
}

/**
 * Caminho do menu até a tela atual. Níveis com rota viram link; um grupo ou item pai sem rota própria
 * lista as telas que tem dentro (para ir a uma irmã sem voltar ao menu); a tela atual fica por último, sem link.
 */
export function menuCrumbs(groups: NavGroup[], pathname: string, search: string): Crumb[] {
  const activeId = activeItemId(groups, pathname, search);
  const { group, items } = activeTrail(groups, pathname, search);
  const crumbs: Crumb[] = [];
  if (group && typeof group.title === 'string') {
    crumbs.push({ title: group.title, options: withOptions(screensOf(group.items, activeId)) });
  }
  items.forEach((item, i) => {
    const last = i === items.length - 1;
    if (last) crumbs.push({ title: item.title });
    else if (item.url && !item.external) crumbs.push({ title: item.title, to: item.url });
    else crumbs.push({ title: item.title, options: withOptions(screensOf(item.children ?? [], activeId)) });
  });
  return crumbs;
}
