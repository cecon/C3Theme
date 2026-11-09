import { describe, expect, it } from 'vitest';

import type { EntityDef } from '../../types';
import { paramChanges, paramText, readSourceParams } from './sourceParams';

const def = {
  name: 'estoque_posicao',
  label: { singular: 'Posição', plural: 'Posição' },
  fields: [],
  source: 'system',
  params: {
    fields: [
      { name: 'data', type: 'date' },
      { name: 'almox', type: 'reference', entity: 'almox' }
    ]
  },
  paramDefaults: { data: '2026-11-05' }
} as EntityDef;

describe('parâmetros da consulta', () => {
  it('sem nada na URL valem os defaults resolvidos; com algum, só a URL', () => {
    expect(readSourceParams(def, new URLSearchParams())).toEqual({ data: '2026-11-05' });
    expect(readSourceParams(def, new URLSearchParams('p.data=2026-01-31&page=2'))).toEqual({ data: '2026-01-31' });
    expect(readSourceParams(def, new URLSearchParams('p.data=&p.almox=3'))).toEqual({ data: '', almox: '3' });
    expect(readSourceParams({ ...def, source: undefined }, new URLSearchParams('p.data=x'))).toBeUndefined();
  });

  it('reference vai como id; vazio também vai, para não voltar ao default', () => {
    expect(paramText({ id: '3', title: 'Central' })).toBe('3');
    expect(paramText(null)).toBe('');
    expect(paramChanges(def, { data: '2026-12-31', almox: null })).toEqual({ 'p.data': '2026-12-31', 'p.almox': '' });
  });
});
