import { describe, expect, it } from 'vitest';

import { editsInline, formStart } from './formStart';
import { initialRecord } from './formValues';
import type { EntityDef } from './types';

const item: EntityDef = {
  name: 'item',
  label: { singular: 'Item', plural: 'Itens' },
  fields: [
    { name: 'fatura', type: 'reference', entity: 'fatura' },
    { name: 'descricao', type: 'string' },
    { name: 'quantidade', type: 'integer', default: 1 }
  ]
};

const fatura: EntityDef = {
  name: 'fatura',
  label: { singular: 'Fatura', plural: 'Faturas' },
  fields: [
    { name: 'emissao', type: 'date' },
    { name: 'vencimento', type: 'date' },
    { name: 'status', type: 'enum', default: 'rascunho', options: [] }
  ],
  views: {
    list: { presets: [{ id: 'pagas', label: 'Pagas', where: { field: 'status', op: 'eq', value: 'paga' }, defaults: { status: 'paga' } }] },
    form: {
      initial: { emissao: { $date: 'today' }, vencimento: { $date: 'today', offset: 15 }, status: 'pendente' },
      sections: [{ related: { entity: 'item', field: 'fatura', save: 'with_parent', minItems: 2 } }]
    }
  }
};

const childDef = (e: string) => (e === 'item' ? item : undefined);

describe('começo do registro novo', () => {
  it('resolve a data relativa e abre as linhas mínimas com os padrões da filha', () => {
    const now = new Date(2026, 10, 9, 10);
    expect(formStart(fatura, childDef, now)).toEqual({
      emissao: '2026-11-09',
      vencimento: '2026-11-24',
      status: 'pendente',
      item: [{ quantidade: 1 }, { quantidade: 1 }]
    });
  });

  it('initial ganha do default e perde para o preset', () => {
    expect(initialRecord(fatura, null, undefined, childDef).status).toBe('pendente');
    expect(initialRecord(fatura, 'pagas', undefined, childDef).status).toBe('paga');
  });

  it('lista com texto longo vai para o diálogo, sem linhas vazias', () => {
    const longo: EntityDef = { ...item, fields: [...item.fields, { name: 'obs', type: 'text' }] };
    expect(editsInline(longo, 'fatura')).toBe(false);
    expect(formStart(fatura, (e) => (e === 'item' ? longo : undefined)).item).toBeUndefined();
  });

  it('checklist com minItems não abre linha vazia (minItems ali é só validação)', () => {
    const lista: EntityDef = {
      ...fatura,
      views: {
        form: { sections: [{ related: { entity: 'item', field: 'fatura', save: 'with_parent', display: 'checklist', minItems: 1 } }] }
      }
    };
    expect(formStart(lista, childDef).item).toBeUndefined();
  });
});
