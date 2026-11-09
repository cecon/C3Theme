import { describe, expect, it } from 'vitest';

import { agentTaskOf } from './task';

describe('agentTaskOf', () => {
  it('rascunho novo, alteração e ação', () => {
    const values = { nome: 'Acme', limite: 500 };
    expect(agentTaskOf({ kind: 'c3.record', payload: { entity: 'cliente', values, suggested: { limite: 'do pedido' } } })).toEqual({
      entity: 'cliente',
      op: 'create',
      fields: 2,
      suggested: 1
    });
    expect(agentTaskOf({ kind: 'c3.record', payload: { entity: 'cliente', id: '7', values } })?.op).toBe('update');
    expect(agentTaskOf({ kind: 'c3.action', payload: { entity: 'pedido', id: '1', action: 'cancelar', input: { motivo: 'x' } } })).toEqual({
      entity: 'pedido',
      op: 'action',
      action: 'cancelar',
      fields: 1,
      suggested: 0
    });
  });

  it('formulário avulso e payload estranho não são tarefa', () => {
    expect(agentTaskOf({ kind: 'c3.form', payload: { fields: [] } })).toBeNull();
    expect(agentTaskOf({ kind: 'c3.record', payload: null })).toBeNull();
    expect(agentTaskOf({ kind: 'c3.action', payload: { entity: 'pedido' } })).toBeNull();
  });
});
