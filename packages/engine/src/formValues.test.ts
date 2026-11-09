import { describe, expect, it } from 'vitest';

import { defaults, initialRecord, newRecordPath } from './formValues';
import type { EntityDef } from './types';

const def: EntityDef = {
  name: 'customer',
  label: { singular: 'Cliente', plural: 'Clientes' },
  fields: [
    {
      name: 'status',
      type: 'enum',
      default: 'lead',
      options: [
        { value: 'lead', label: 'Lead' },
        { value: 'active', label: 'Ativo' }
      ]
    },
    { name: 'vip', type: 'boolean' },
    { name: 'created_at', type: 'datetime', readOnly: true, default: 'x' }
  ],
  views: {
    list: {
      presets: [
        { id: 'ativos', label: 'Ativos', where: { field: 'status', op: 'eq', value: 'active' }, defaults: { status: 'active' } },
        { id: 'vip', label: 'VIP', where: { field: 'vip', op: 'eq', value: true }, defaults: { vip: true } }
      ]
    }
  }
};

describe('defaults', () => {
  it('sem preset: o default de cada campo, sem os readOnly', () => {
    expect(defaults(def)).toEqual({ status: 'lead' });
  });
  it('o preset sobrepõe e soma aos defaults dos campos', () => {
    expect(defaults(def, 'ativos')).toEqual({ status: 'active' });
    expect(defaults(def, 'vip')).toEqual({ status: 'lead', vip: true });
  });
  it('preset inexistente é ignorado', () => {
    expect(defaults(def, 'nope')).toEqual({ status: 'lead' });
  });
});

describe('initialRecord', () => {
  it('usa o preset da URL', () => {
    expect(initialRecord(def, 'vip')).toEqual({ status: 'lead', vip: true });
  });
  it('embutido ignora o preset da URL; initial e fixed do diálogo valem por último', () => {
    expect(initialRecord(def, 'vip', { initial: { status: 'active' }, fixed: { vip: false } })).toEqual({ status: 'active', vip: false });
  });
});

describe('newRecordPath', () => {
  it('leva o preset codificado', () => {
    expect(newRecordPath('customer')).toBe('/customer/new');
    expect(newRecordPath('customer', 'a b&c')).toBe('/customer/new?preset=a%20b%26c');
  });
});
