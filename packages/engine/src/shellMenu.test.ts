import { describe, expect, it } from 'vitest';

import { buildMenu, type MenuDeps } from './shellMenu';
import type { AppDef } from './types';

const deps: MenuDeps = {
  entities: {},
  text: (t, fallback = '') => (typeof t === 'string' ? t : (t?.defaultMessage ?? fallback)),
  shown: () => true,
  icon: () => undefined,
  badge: () => undefined
};

const app = {
  name: 'teste',
  layout: {
    orientation: 'rail',
    menu: [
      { items: [{ title: 'Equipe', icon: 'People', children: [{ path: '/equipe' }] }] },
      { items: [{ title: 'Loja', icon: 'Shop', children: [{ path: '/loja/agentes' }] }] }
    ]
  }
} as unknown as AppDef;

describe('buildMenu', () => {
  it('módulos sem rota em grupos diferentes têm ids diferentes (#162)', () => {
    const [equipe, loja] = buildMenu(app, deps).map((g) => g.items[0]!);
    expect(equipe.title).toBe('Equipe');
    expect(loja.title).toBe('Loja');
    expect(equipe.id).not.toBe(loja.id);
  });

  it('todos os ids do menu são únicos, também nos filhos sem rota', () => {
    const nested = {
      ...app,
      layout: {
        menu: [
          {
            items: [
              { title: 'A', children: [{ title: 'A1', children: [{ path: '/x' }] }] },
              { title: 'B', children: [{ title: 'B1', children: [{ path: '/y' }] }] }
            ]
          }
        ]
      }
    } as unknown as AppDef;
    const ids: string[] = [];
    const walk = (items: { id: string; children?: unknown[] }[]) =>
      items.forEach((i) => {
        ids.push(i.id);
        walk((i.children ?? []) as { id: string }[]);
      });
    buildMenu(nested, deps).forEach((g) => walk(g.items));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('item com entidade ou rota mantém o id de antes', () => {
    const plain = { ...app, layout: { menu: [{ items: [{ entity: 'cliente' }, { path: '/painel' }] }] } } as unknown as AppDef;
    expect(buildMenu(plain, deps)[0]!.items.map((i) => i.id)).toEqual(['cliente-0', '/painel-1']);
  });
});
