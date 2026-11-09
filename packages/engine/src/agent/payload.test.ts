import { describe, expect, it } from 'vitest';

import type { EntityDef } from '../types';
import { checkAction, checkForm, checkRecord } from './payload';

const cliente: EntityDef = {
  name: 'cliente',
  label: { singular: 'Cliente', plural: 'Clientes' },
  titleField: 'nome',
  fields: [
    { name: 'nome', type: 'string', required: true },
    { name: 'limite', type: 'decimal', aiReview: true },
    { name: 'codigo', type: 'string', createOnly: true },
    { name: 'senha', type: 'string', writeOnly: true },
    { name: 'criado', type: 'datetime', readOnly: true }
  ],
  actions: [
    { name: 'bloquear', label: 'Bloquear', tone: 'danger', input: { fields: [{ name: 'motivo', type: 'string' }] } },
    { name: 'importar', label: 'Importar', target: 'list' }
  ]
};
const entities = { cliente: { def: cliente } };

describe('payload das partes do assistente', () => {
  it('c3.form: campos avulsos, sem senha nem arquivo', () => {
    expect(
      checkForm({ fields: [{ name: 'motivo', type: 'string' }], values: { motivo: 'x' }, suggested: { motivo: 'do e-mail' } }, entities)
    ).toBeNull();
    expect(checkForm({ fields: [] }, entities)).toMatch(/fields/);
    expect(checkForm({ fields: [{ name: 'pin', type: 'string', writeOnly: true }] }, entities)).toMatch(/senha/);
    expect(checkForm({ fields: [{ name: 'doc', type: 'file' }] }, entities)).toMatch(/arquivo/);
    expect(
      checkForm(
        {
          fields: [
            { name: 'a', type: 'string' },
            { name: 'a', type: 'string' }
          ]
        },
        entities
      )
    ).toMatch(/repetido/);
    expect(checkForm({ fields: [{ name: 'c', type: 'reference', entity: 'nada' }] }, entities)).toMatch(/desconhecida/);
    expect(checkForm({ fields: [{ name: 'a', type: 'string' }], values: { b: 1 } }, entities)).toMatch(/'b'/);
    expect(checkForm({ fields: [{ name: 'a', type: 'string' }], suggested: { a: 'x' } }, entities)).toMatch(/suggested/);
  });

  it('c3.record: só campos que o usuário poderia editar', () => {
    expect(checkRecord({ entity: 'cliente', values: { nome: 'Acme', codigo: 'A1' } }, entities)).toBeNull();
    expect(checkRecord({ entity: 'cliente', id: '7', values: { codigo: 'A2' } }, entities)).toMatch(/codigo/);
    expect(checkRecord({ entity: 'cliente', values: { senha: '123' } }, entities)).toMatch(/senha/);
    expect(checkRecord({ entity: 'cliente', values: { criado: 'x' } }, entities)).toMatch(/criado/);
    expect(checkRecord({ entity: 'cliente', values: { inventado: 1 } }, entities)).toMatch(/inventado/);
    expect(checkRecord({ entity: 'outra', values: { nome: 'x' } }, entities)).toMatch(/desconhecida/);
    expect(checkRecord({ entity: 'cliente', values: {} }, entities)).toMatch(/values/);
  });

  it('c3.action: ação do registro com input conhecido', () => {
    expect(checkAction({ entity: 'cliente', id: '7', action: 'bloquear', input: { motivo: 'atraso' } }, entities)).toBeNull();
    expect(checkAction({ entity: 'cliente', id: '7', action: 'importar' }, entities)).toMatch(/lista/);
    expect(checkAction({ entity: 'cliente', id: '7', action: 'sumir' }, entities)).toMatch(/desconhecida/);
    expect(checkAction({ entity: 'cliente', id: '7', action: 'bloquear', input: { outro: 1 } }, entities)).toMatch(/outro/);
    expect(checkAction({ entity: 'cliente', action: 'bloquear' }, entities)).toMatch(/precisa/);
  });
});
