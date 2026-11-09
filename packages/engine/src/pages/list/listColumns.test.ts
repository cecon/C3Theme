import { describe, expect, it } from 'vitest';

import type { EntityDef } from '../../types';
import { listColumns, recordTitle } from './listColumns';
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
