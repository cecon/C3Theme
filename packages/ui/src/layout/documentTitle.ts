import { useEffect } from 'react';
import { useLocation } from 'react-router';

import { useBranding } from '../config';
import { NavGroup, activeTrail } from './nav';

/**
 * Título da aba a partir do menu: a tela, o nível de cima e a marca ("Lista de faturas · Faturas · C3").
 * Fora do menu, só a marca. Nomes que não são texto (ícone, elemento) ficam de fora.
 */
export function pageTitle(groups: NavGroup[], pathname: string, search: string, brand: string): string {
  const { group, items } = activeTrail(groups, pathname, search);
  const trail = [group?.title, ...items.map((i) => i.title)].filter((t): t is string => typeof t === 'string' && t !== '');
  return [...trail.slice(-2).reverse(), brand].join(' · ');
}

/** Mantém `document.title` igual à tela atual do menu; quem lê a aba, o histórico ou um link compartilhado sabe onde está. */
export function useDocumentTitle(groups: NavGroup[], enabled = true) {
  const { name } = useBranding();
  const { pathname, search } = useLocation();
  useEffect(() => {
    if (enabled) document.title = pageTitle(groups, pathname, search, name);
  }, [enabled, groups, pathname, search, name]);
}
