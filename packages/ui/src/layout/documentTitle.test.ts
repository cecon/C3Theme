import { describe, expect, it } from 'vitest';

import { pageTitle } from './documentTitle';
import type { NavGroup } from './nav';

const groups: NavGroup[] = [
  { id: 'painel', title: 'Painéis', items: [{ id: 'padrao', title: 'Padrão', url: '/dashboard/padrao' }] },
  {
    id: 'apps',
    title: 'Aplicativos',
    items: [
      {
        id: 'faturas',
        title: 'Faturas',
        children: [{ id: 'lista', title: 'Lista de faturas', url: '/faturas/lista' }]
      }
    ]
  }
];

describe('pageTitle', () => {
  it('tela, nível de cima e marca', () => {
    expect(pageTitle(groups, '/dashboard/padrao', '', 'C3')).toBe('Padrão · Painéis · C3');
    expect(pageTitle(groups, '/faturas/lista', '', 'C3')).toBe('Lista de faturas · Faturas · C3');
  });

  it('fora do menu fica só a marca', () => {
    expect(pageTitle(groups, '/fatura/1026', '', 'C3')).toBe('C3');
  });
});
