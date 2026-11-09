import { describe, expect, it } from 'vitest';

import { menuCrumbs } from './crumbs';
import type { NavGroup } from './nav';

const groups: NavGroup[] = [
  {
    id: 'tes',
    title: 'Tesouraria',
    items: [
      { id: 'caixas', title: 'Caixas Abertos', url: '/caixas' },
      { id: 'mov', title: 'Movimentos', url: '/movimentos' },
      { id: 'site', title: 'Banco', url: 'https://banco.example', external: true }
    ]
  },
  {
    id: 'cad',
    title: 'Cadastros',
    items: [
      { id: 'pessoas', title: 'Pessoas', children: [{ id: 'cli', title: 'Clientes', url: '/clientes' }] },
      { id: 'prod', title: 'Produtos', url: '/produtos', children: [{ id: 'grade', title: 'Grade', url: '/produtos/grade' }] }
    ]
  }
];

describe('menuCrumbs', () => {
  it('grupo sem rota lista as telas internas, marca a atual e deixa a atual sem link', () => {
    expect(menuCrumbs(groups, '/caixas', '')).toEqual([
      {
        title: 'Tesouraria',
        options: [
          { title: 'Caixas Abertos', to: '/caixas', current: true },
          { title: 'Movimentos', to: '/movimentos', current: false }
        ]
      },
      { title: 'Caixas Abertos' }
    ]);
  });

  it('pai com rota vira link; nível sem outra tela para escolher fica só texto', () => {
    const crumbs = menuCrumbs(groups, '/produtos/grade', '');
    expect(crumbs[1]).toEqual({ title: 'Produtos', to: '/produtos' });
    expect(crumbs[2]).toEqual({ title: 'Grade' });
    expect(menuCrumbs(groups, '/clientes', '')[1]).toEqual({ title: 'Pessoas', options: undefined });
  });

  it('a lista fica num nível só: subgrupo leva à primeira tela dele', () => {
    expect(menuCrumbs(groups, '/clientes', '')[0]).toEqual({
      title: 'Cadastros',
      options: [
        { title: 'Pessoas', to: '/clientes', current: true },
        { title: 'Produtos', to: '/produtos', current: false }
      ]
    });
  });

  it('fora do menu não há caminho', () => {
    expect(menuCrumbs(groups, '/outra', '')).toEqual([]);
  });
});
