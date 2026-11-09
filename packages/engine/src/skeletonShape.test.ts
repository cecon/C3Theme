import { describe, expect, it } from 'vitest';

import { columnCell, formBlocks } from './skeletonShape';
import type { EntityDef, FormSection } from './types';

const def: EntityDef = {
  name: 'pedido',
  label: { singular: 'Pedido', plural: 'Pedidos' },
  fields: [
    { name: 'numero', type: 'string' },
    { name: 'cliente', type: 'string' },
    { name: 'status', type: 'enum', options: [{ value: 'a', label: 'A' }] },
    { name: 'motivo', type: 'string', visibleWhen: { field: 'status', op: 'eq', value: 'a' } },
    { name: 'empresa', type: 'string' }
  ]
};

describe('columnCell', () => {
  it('enum vira chip e o resto texto', () => {
    expect(columnCell(def.fields[2])).toBe('chip');
    expect(columnCell(def.fields[0])).toBe('text');
    expect(columnCell(undefined)).toBe('text');
  });
});

describe('formBlocks', () => {
  it('conta os campos de cada linha, sem os condicionais e os fixos do diálogo', () => {
    const sections: FormSection[] = [{ title: 'Dados', rows: [['numero', 'cliente'], ['status', 'motivo'], ['empresa']] }];
    expect(formBlocks(def, sections)).toEqual([{ title: true, lines: [2, 1, 1] }]);
    expect(formBlocks(def, sections, ['empresa'])).toEqual([{ title: true, lines: [2, 1] }]);
  });

  it('abas: seções de cima, a barra e só as seções da primeira aba', () => {
    const sections: FormSection[] = [
      { rows: [['numero']] },
      { title: 'Geral', tab: 'Geral', rows: [['cliente', 'status']] },
      { title: 'Itens', tab: 'Itens', related: { entity: 'item', field: 'pedido_id', save: 'with_parent' } }
    ];
    expect(formBlocks(def, sections)).toEqual([{ title: false, lines: [1] }, { tabs: 2 }, { title: true, lines: [2] }]);
  });

  it('uma aba só não mostra barra; filha vira tabela e filha de uma linha vira campos', () => {
    const sections: FormSection[] = [
      { tab: 'Geral', related: { entity: 'item', field: 'pedido_id' } },
      { tab: 'Geral', related: { entity: 'fiscal', field: 'pedido_id', save: 'with_parent', maxItems: 1 } }
    ];
    expect(formBlocks(def, sections)).toEqual([
      { title: true, table: 3 },
      { title: true, lines: [2, 2] }
    ]);
  });

  it('campos só leitura viram um painel no fim, dois por linha', () => {
    const withReadOnly: EntityDef = {
      ...def,
      fields: [...def.fields, ...['a', 'b', 'c'].map((name) => ({ name, type: 'string' as const, readOnly: true }))]
    };
    expect(formBlocks(withReadOnly, [{ rows: [['numero']] }])).toEqual([{ title: false, lines: [1] }, { lines: [2, 1] }]);
  });

  it('seção condicional e seção vazia ficam de fora', () => {
    const sections: FormSection[] = [
      { title: 'Motivo', rows: [['motivo']] },
      { title: 'Extra', visibleWhen: { field: 'status', op: 'eq', value: 'a' }, rows: [['numero']] }
    ];
    expect(formBlocks(def, sections)).toEqual([]);
  });
});
