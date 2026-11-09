import type { ReactNode } from 'react';

import type { NavGroup, NavItem } from '@c3theme/ui';
import { itemUrl } from './routes';
import type { AppDef, EntityDef, MenuItemDef, Text } from './types';

export interface MenuDeps {
  entities: Record<string, { def: EntityDef } | undefined>;
  text: (t: Text | undefined, fallback?: string) => string;
  /** Item que a pessoa pode abrir (página registrada sem permissão some do menu). */
  shown: (item: MenuItemDef) => boolean;
  icon: (name: string | undefined) => NavItem['icon'];
  badge: (item: MenuItemDef) => ReactNode;
}

/**
 * Menu do AppLayout a partir do `layout.menu` da spec. `where` é a posição no menu (grupo e índices): item sem
 * entidade, rota ou link (módulo do trilho, grupo) só tem a posição para ser único. Com o índice só do grupo, o
 * primeiro módulo de cada grupo recebia o mesmo id e o trilho abria o painel errado (#162).
 */
export function buildMenu(app: AppDef, deps: MenuDeps): NavGroup[] {
  const { entities, text, shown, icon, badge } = deps;
  const toNav =
    (where: string) =>
    (item: MenuItemDef, i: number): NavItem => {
      const entity = item.entity ? entities[item.entity]?.def : undefined;
      const title = item.title ?? entity?.label.plural ?? app.pages?.find((p) => p.path === item.path)?.title;
      const base = item.entity ?? item.path ?? item.href;
      return {
        id: base ? `${base}-${item.view ? `${item.view}-` : ''}${item.preset ?? i}` : `grupo-${where}-${i}`,
        title: text(title, item.path ?? item.href ?? ''),
        icon: icon(item.icon ?? entity?.icon),
        url: itemUrl(item),
        external: Boolean(item.href),
        badge: badge(item),
        children: item.children?.filter(shown).map(toNav(`${where}-${i}`))
      };
    };
  return app.layout.menu.map((g, i) => ({
    id: `grupo-${i}`,
    title: g.title ? text(g.title) : undefined,
    items: g.items.filter(shown).map(toNav(String(i)))
  }));
}
