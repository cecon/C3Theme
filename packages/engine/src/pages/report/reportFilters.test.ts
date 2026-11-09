import { describe, expect, it } from 'vitest';

import type { EntityDef, Text } from '../../types';
import { reportFilters } from './reportFilters';

const def: EntityDef = {
  name: 'venda',
  label: { singular: 'Venda', plural: 'Vendas' },
  fields: [
    { name: 'status', type: 'enum', label: 'Situação', options: [{ value: 'open', label: 'Aberto' }] },
    { name: 'seller_id', type: 'reference', entity: 'seller', label: 'Vendedor' }
  ],
  params: { fields: [{ name: 'data', type: 'date', label: 'Posição em' }] },
  views: { list: { presets: [{ id: 'mes', label: 'Este mês', where: { field: 'status', op: 'eq', value: 'open' } }] } }
};
const text = (t: Text | undefined, fallback = '') => (typeof t === 'string' ? t : fallback);

describe('reportFilters', () => {
  it('preset, filtros, parâmetros aplicados (mesmo o default), busca e filiais, em texto para o papel', () => {
    const params = new URLSearchParams('f.status=open&f.seller_id=3&q=bala&w=%7B%7D');
    const out = reportFilters(def, params, 'mes', { data: '2026-11-05' }, ['Matriz', 'Centro'], 'pt-BR', text);
    expect(out).toEqual([
      'Este mês',
      'Situação: Aberto',
      'Vendedor: nº 3',
      'Posição em: 05/11/2026',
      'Busca: “bala”',
      'Recorte do painel',
      'Filiais: Matriz, Centro'
    ]);
  });

  it('sem nada aplicado, nada a dizer', () => {
    expect(reportFilters(def, new URLSearchParams(), undefined, undefined, [], 'pt-BR', text)).toEqual([]);
  });
});
