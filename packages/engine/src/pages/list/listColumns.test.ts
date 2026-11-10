import { describe, expect, it } from 'vitest';

import type { EntityDef } from '../../types';
import { listColumns, recordTitle, withSourceColumns } from './listColumns';
import { allowedRowActions } from './RowActionsCell';

const def = {
  name: 'cliente',
  label: { singular: 'Cliente', plural: 'Clientes' },
  fields: [
    { name: 'nome', type: 'string' },
    { name: 'email', type: 'email' },
    { name: 'cidade', type: 'string' },
    { name: 'uf', type: 'string' }
  ],
  views: {
    list: {
      columns: [{ field: 'nome', label: 'Cliente', avatar: true, secondary: 'email' }, { field: 'cidade', join: ['uf'] }, 'email']
    }
  }
} as unknown as EntityDef;

describe('colunas da lista', () => {
  it('liga secondary, join e avatar às definições dos campos', () => {
    const [nome, cidade, email] = listColumns(def);
    expect(nome).toMatchObject({ field: 'nome', label: 'Cliente', def: { name: 'nome' } });
    expect(nome.extras).toMatchObject({ secondary: { name: 'email' }, avatar: true });
    expect(cidade.extras.join?.map((f) => f.name)).toEqual(['uf']);
    expect(email.extras).toEqual({ secondary: undefined, join: undefined, avatar: undefined, link: undefined, weight: undefined });
  });

  it('título do registro: titleField, primeiro texto ou id', () => {
    expect(recordTitle(def)({ id: '7', nome: 'Ana' })).toBe('Ana');
    expect(recordTitle(def)({ id: '7', nome: '' })).toBe('7');
    const ref = { ...def, titleField: 'dono', fields: [...def.fields, { name: 'dono', type: 'reference' as const, reference: 'agente' }] };
    expect(recordTitle(ref)({ id: '7', dono: { id: '3', title: 'Atendente' } })).toBe('Atendente');
  });
});

describe('ações na linha', () => {
  it('editar e excluir só com a permissão da tela e do registro', () => {
    const all = ['view', 'edit', 'delete'] as const;
    expect(allowedRowActions([...all], {})).toEqual(['view']);
    expect(allowedRowActions([...all], { update: true, delete: true })).toEqual(['view', 'edit', 'delete']);
    expect(allowedRowActions([...all], { update: true, delete: true }, { id: '1', _can: { update: true, delete: false } })).toEqual([
      'view',
      'edit'
    ]);
  });
});

describe('colunas da consulta do sistema (meta.columns, #60)', () => {
  const cols = listColumns(def);
  it('sem meta.columns, as da view', () => {
    expect(withSourceColumns(def, cols, undefined)).toBe(cols);
  });
  it('só as que vieram, na ordem, com o rótulo também no campo (exportação); fora da view entra simples', () => {
    const got = withSourceColumns(def, cols, [{ field: 'uf', label: 'Estado' }, { field: 'nome' }, { field: 'sumiu' }]);
    expect(got.map((c) => c.field)).toEqual(['uf', 'nome']);
    expect([got[0].label, got[0].def.label]).toEqual(['Estado', 'Estado']);
    expect(got[1]).toBe(cols[0]);
  });
});
