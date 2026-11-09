import { describe, expect, it } from 'vitest';

import type { EntityDef } from './types';
import { extraReadOnly, recordTitle } from './views';

const def = {
  name: 'conversa',
  label: { singular: 'Conversa', plural: 'Conversas' },
  titleField: 'agente',
  fields: [
    { name: 'agente', type: 'reference', entity: 'agente' },
    { name: 'workspace', type: 'string', readOnly: true },
    { name: 'created_at', type: 'datetime', readOnly: true },
    { name: 'tokens', type: 'integer', readOnly: true }
  ]
} as unknown as EntityDef;

describe('formulário: campos de leitura e título (#161)', () => {
  it('o painel do fim mostra só os de leitura fora das seções', () => {
    const sections = [{ title: 'Onde fica', rows: [['workspace', { field: 'created_at' }]] }];
    expect(extraReadOnly(def, sections).map((f) => f.name)).toEqual(['tokens']);
  });

  it('entidade toda de leitura nas seções: painel vazio (não aparece)', () => {
    expect(extraReadOnly(def, [{ rows: [['workspace'], ['created_at', 'tokens']] }])).toEqual([]);
  });

  it('titleField reference usa o title do { id, title }', () => {
    expect(recordTitle(def, { id: '1', agente: { id: '9', title: 'Atendente' } })).toBe('Atendente');
    expect(recordTitle(def, { id: '1', agente: { id: '9', title: null } })).toBe('');
    expect(recordTitle(def, { id: '1', agente: null })).toBe('');
    expect(recordTitle({ ...def, titleField: 'workspace' }, { id: '1', workspace: 'Loja' })).toBe('Loja');
  });
});
