// Regras do assistente em passos (#34): campos do passo, obrigatórios, o que grava e a guarda.
import { describe, expect, it } from 'vitest';

import type { FieldDef } from './types';
import { guardPage, guardRedirect, stepErrors, stepFields, stepPatch } from './wizard';

const fields = [
  { name: 'cnpj', type: 'string', required: true },
  { name: 'nome', type: 'string' },
  { name: 'pendente', type: 'boolean', readOnly: true, required: true }
] as FieldDef[];
const step = {
  title: 'Loja',
  rows: [
    ['cnpj', { field: 'nome' }],
    ['pendente', 'sumiu']
  ]
};

describe('assistente', () => {
  it('stepFields: os campos das linhas que existem, na ordem', () => {
    expect(stepFields(fields, step).map((f) => f.name)).toEqual(['cnpj', 'nome', 'pendente']);
    expect(stepFields(fields, { title: 'x', rows: undefined as never })).toEqual([]);
  });

  it('stepErrors: obrigatório vazio e visível; só leitura e escondido não contam', () => {
    const req = (f: FieldDef) => Boolean(f.required);
    expect(stepErrors(fields, { cnpj: '' }, () => true, req)).toEqual({ cnpj: 'Campo obrigatório.' });
    expect(stepErrors(fields, { cnpj: '1' }, () => true, req)).toEqual({});
    expect(stepErrors(fields, {}, (f) => f.name !== 'cnpj', req)).toEqual({});
  });

  it('stepPatch: só os campos graváveis do passo', () => {
    expect(stepPatch(fields, { cnpj: '1', nome: null, pendente: true, outro: 'x' })).toEqual({ cnpj: '1', nome: null });
  });

  it('guardPage e guardRedirect: leva ao assistente só com pending verdadeiro e fora dele', () => {
    const wizard = { entity: 'loja', pending: 'pendente', steps: [] };
    expect(
      guardPage([
        { path: '/a', wizard: { ...wizard, pending: undefined } },
        { path: '/b', wizard }
      ])?.path
    ).toBe('/b');
    expect(guardPage()).toBeUndefined();
    expect(guardRedirect('/cliente', '/b', { pendente: true }, 'pendente')).toBe('/b');
    expect(guardRedirect('/b', '/b', { pendente: true }, 'pendente')).toBeUndefined();
    expect(guardRedirect('/b/x', '/b', { pendente: true }, 'pendente')).toBeUndefined();
    expect(guardRedirect('/cliente', '/b', { pendente: false }, 'pendente')).toBeUndefined();
    expect(guardRedirect('/cliente', '/b', undefined, 'pendente')).toBeUndefined();
  });
});
