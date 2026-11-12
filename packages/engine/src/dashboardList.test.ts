// Lista do painel com abas, filtro e mais de 10 linhas; aviso com soma; variação do KPI (#64).
import { describe, expect, it } from 'vitest';

import { alertText, type AlertWidget, type ListWidget } from './dashboard';
import { applyFilters, type DashboardFilter } from './dashboardFilters';
import { LIST_MAX, listLimit, listTabs, localWhere, variation } from './dashboardList';
import type { EntityDef } from './types';

const titulos: ListWidget = {
  type: 'list',
  title: 'Títulos',
  entity: 'receber',
  preset: 'abertos',
  columns: ['numero', 'valor'],
  sort: 'vencimento',
  tabs: [
    { label: 'A receber', preset: 'abertos' },
    { label: 'A pagar', entity: 'pagar', where: { field: 'pago', op: 'eq', value: false }, sort: '-valor' }
  ]
};
const def = {
  name: 'receber',
  label: { singular: 'T', plural: 'T' },
  fields: [
    {
      name: 'situacao',
      type: 'enum',
      options: [
        { value: 1, label: 'Aberto' },
        { value: 'B', label: 'Baixado' }
      ]
    },
    { name: 'autorizado', type: 'boolean' },
    { name: 'valor', type: 'decimal', scale: 2 }
  ]
} as unknown as EntityDef;

describe('lista do painel', () => {
  it('limite: padrão 5, teto 200, mínimo 1', () => {
    expect(listLimit({ ...titulos, limit: undefined })).toBe(5);
    expect(listLimit({ ...titulos, limit: 500 })).toBe(LIST_MAX);
    expect(listLimit({ ...titulos, limit: 0 })).toBe(1);
  });

  it('cada aba vira um widget com a entidade e o filtro dela; colunas e ordem do widget quando a aba não diz', () => {
    const [receber, pagar] = listTabs(titulos);
    expect(receber).toMatchObject({ entity: 'receber', preset: 'abertos', where: undefined, sort: 'vencimento', label: 'A receber' });
    expect(pagar).toMatchObject({ entity: 'pagar', preset: undefined, columns: ['numero', 'valor'], sort: '-valor' });
    expect(pagar.tabs).toBeUndefined();
    expect(listTabs({ ...titulos, tabs: undefined })).toEqual([{ ...titulos, tabs: undefined }]);
  });

  it('o filtro do painel entra em todas as abas', () => {
    const filters: DashboardFilter[] = [{ name: 'venc', type: 'period', default: 'month' }];
    const out = applyFilters({ ...titulos, bind: { venc: 'vencimento' } }, filters, { venc: 'today' });
    expect(out.where).toBeUndefined();
    expect(out.tabs?.[0].where).toMatchObject({
      and: [
        { field: 'vencimento', op: 'gte' },
        { field: 'vencimento', op: 'lt' }
      ]
    });
    expect(out.tabs?.[1].where).toMatchObject({ and: [{ field: 'pago' }, { and: [{ field: 'vencimento' }, { field: 'vencimento' }] }] });
  });

  it('seletor do cartão: enum com o valor tipado, boolean, e vazio é Todos', () => {
    expect(localWhere(def, 'situacao', '1')).toEqual({ field: 'situacao', op: 'eq', value: 1 });
    expect(localWhere(def, 'situacao', 'B')).toEqual({ field: 'situacao', op: 'eq', value: 'B' });
    expect(localWhere(def, 'situacao', 'X')).toEqual({ field: 'situacao', op: 'eq', value: 'X' });
    expect(localWhere(def, 'autorizado', 'false')).toEqual({ field: 'autorizado', op: 'eq', value: false });
    expect(localWhere(def, 'situacao', '')).toBeUndefined();
    expect(localWhere(def, undefined, '1')).toBeUndefined();
    expect(localWhere(def, 'sumiu', '1')).toBeUndefined();
  });
});

describe('aviso com soma', () => {
  const alert: AlertWidget = { type: 'alert', title: '', entity: 'receber', text: '', measure: 'sum:valor' };
  it('{count} e {value} no formato do campo somado', () => {
    const out = alertText('{count} títulos vencendo, {value}', alert, def, { key: null, value: 3, values: [3, '1234.56'] }, 'pt-BR');
    expect(out).toBe('3 títulos vencendo, 1.234,56');
    expect(alertText('{value}', alert, def, { key: null, value: 0, values: [0] }, 'pt-BR')).toBe('0,00');
  });
  it('sem measure, só a contagem', () => {
    expect(alertText('{count} sem NFC-e', { ...alert, measure: undefined }, def, { key: null, value: 1200 }, 'pt-BR')).toBe(
      '1.200 sem NFC-e'
    );
    expect(alertText('{count}', { ...alert, measure: undefined }, def, undefined, 'pt-BR')).toBe('0');
  });
});

describe('variação do KPI', () => {
  it('% com sinal sobre a base; subir é bom, a não ser com invert', () => {
    expect(variation(120, 100)).toEqual({ pct: 20, up: true, good: true });
    expect(variation(80, 100)).toEqual({ pct: -20, up: false, good: false });
    expect(variation(120, 100, true)).toEqual({ pct: 20, up: true, good: false });
    expect(variation(80, 100, true)).toEqual({ pct: -20, up: false, good: true });
    expect(variation(100, 100, true)).toEqual({ pct: 0, up: false, good: true });
  });
  it('base negativa usa o módulo; base zero não tem variação', () => {
    expect(variation(-50, -100)?.pct).toBe(50);
    expect(variation(10, 0)).toBeUndefined();
  });
});
