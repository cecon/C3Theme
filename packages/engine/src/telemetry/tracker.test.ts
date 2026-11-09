import { describe, expect, it, vi } from 'vitest';

import { changedFields, startTask } from '.';

const deps = () => {
  let t = 1000;
  return { now: () => t, newId: () => 'id1', advance: (ms: number) => (t += ms) };
};

describe('telemetria de tarefa', () => {
  it('emite start e um único fim, com a duração', () => {
    const port = vi.fn();
    const d = deps();
    const task = startTask(port, { entity: 'cliente', op: 'create' }, d);
    d.advance(2500);
    task.done({ fields: 3 });
    task.abandon();
    task.done();
    expect(port.mock.calls.map((c) => c[0])).toEqual([
      { type: 'task.start', taskId: 'id1', entity: 'cliente', op: 'create', channel: 'screen' },
      { type: 'task.done', taskId: 'id1', entity: 'cliente', op: 'create', channel: 'screen', fields: 3, ms: 2500 }
    ]);
    expect(task.finished).toBe(true);
  });

  it('ação leva o nome e abandono não leva campos', () => {
    const port = vi.fn();
    const task = startTask(port, { entity: 'pedido', op: 'action', action: 'cancelar' }, deps());
    task.abandon();
    expect(port).toHaveBeenLastCalledWith({
      type: 'task.abandon',
      taskId: 'id1',
      entity: 'pedido',
      op: 'action',
      action: 'cancelar',
      channel: 'screen',
      ms: 0
    });
  });

  it('erro na porta do sistema não sobe', () => {
    const task = startTask(
      () => {
        throw new Error('fora do ar');
      },
      { entity: 'cliente', op: 'update' }
    );
    expect(() => task.done()).not.toThrow();
  });

  it('conta os campos mudados, sem os de controle', () => {
    const before = { id: '1', nome: 'Acme', limite: 10, _can: { update: true }, itens: [{ q: 1 }] };
    expect(changedFields(before, { ...before, nome: 'Acme SA', itens: [{ q: 2 }], _can: {} })).toBe(2);
    expect(changedFields(undefined, { nome: 'Novo', obs: '' })).toBe(2);
    expect(changedFields({ obs: null }, { obs: undefined })).toBe(0);
  });
});
