import { describe, expect, it } from 'vitest';

import type { NavGroup } from './nav';
import { lintNav } from './navLint';

describe('lintNav', () => {
  it('menu bem montado não tem aviso', () => {
    const ok: NavGroup[] = [
      { id: 'g', items: [{ id: 'ini', title: 'Início', url: '/' }] },
      {
        id: 'cad',
        items: [
          {
            id: 'c',
            title: 'Cadastros',
            children: [
              { id: 'cli', title: 'Clientes', url: '/clientes' },
              {
                id: 'p',
                title: 'Produtos',
                children: [
                  { id: 'pl', title: 'Lista', url: '/p' },
                  { id: 'pa', title: 'Ajustar preço', url: '/pa' }
                ]
              }
            ]
          }
        ]
      }
    ];
    expect(lintNav(ok)).toEqual([]);
  });

  it('pega os erros do menu do print: nome repetido, nível demais, grupo de um filho, título de grupo repetido', () => {
    const bad: NavGroup[] = [
      {
        id: 'cad',
        title: 'CADASTROS',
        items: [
          {
            id: 'u',
            title: 'Usuários',
            children: [
              { id: 'u1', title: 'Usuários', url: '/u' },
              { id: 'u2', title: 'Perfis', url: '/perfis' }
            ]
          },
          {
            id: 'p',
            title: 'Produtos',
            children: [
              {
                id: 'p1',
                title: 'Produtos',
                children: [{ id: 'p2', title: 'Produtos', children: [{ id: 'p3', title: 'Revisão', url: '/r' }] }]
              }
            ]
          },
          {
            id: 'c',
            title: 'Cadastros',
            url: '/x',
            children: [
              { id: 'c1', title: 'A', url: '/a' },
              { id: 'c2', title: 'B', url: '/b' }
            ]
          }
        ]
      }
    ];
    const msgs = lintNav(bad).map((w) => `${w.path}: ${w.message}`);
    expect(msgs.some((m) => m.startsWith('CADASTROS > Usuários > Usuários: mesmo nome do pai'))).toBe(true);
    expect(msgs.some((m) => m.includes('Produtos > Produtos > Produtos > Revisão: nível 4'))).toBe(true);
    expect(msgs.some((m) => m.startsWith('CADASTROS > Produtos: grupo com um filho só'))).toBe(true);
    expect(msgs.some((m) => m.startsWith('CADASTROS > Cadastros: mesmo nome de um título de grupo'))).toBe(true);
    expect(msgs.some((m) => m.startsWith('CADASTROS > Cadastros: tem link e filhos'))).toBe(true);
  });
});
