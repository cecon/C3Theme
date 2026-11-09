import { describe, expect, it } from 'vitest';

import { dismiss, durationOf, EMPTY, MAX_VISIBLE, push, type QueueState } from './queue';

const add = (state: QueueState, id: number, message = `m${id}`, severity: 'success' | 'error' = 'success') =>
  push(state, { id, message, severity });

describe('fila de avisos', () => {
  it('mostra até MAX_VISIBLE e guarda o resto na ordem', () => {
    let s = EMPTY;
    for (let i = 1; i <= MAX_VISIBLE + 2; i++) s = add(s, i);
    expect(s.visible.map((n) => n.id)).toEqual([1, 2, 3]);
    expect(s.waiting.map((n) => n.id)).toEqual([4, 5]);
  });

  it('fechar um abre vaga para o primeiro da espera', () => {
    let s = EMPTY;
    for (let i = 1; i <= 4; i++) s = add(s, i);
    s = dismiss(s, 2);
    expect(s.visible.map((n) => n.id)).toEqual([1, 3, 4]);
    expect(s.waiting).toEqual([]);
  });

  it('aviso repetido soma no contador e recomeça o tempo, sem empilhar', () => {
    let s = add(EMPTY, 1, 'Sem conexão', 'error');
    s = add(s, 2, 'Sem conexão', 'error');
    expect(s.visible).toHaveLength(1);
    expect(s.visible[0]).toMatchObject({ id: 1, count: 2, version: 1 });
  });

  it('mesma mensagem com outro tipo é outro aviso', () => {
    const s = add(add(EMPTY, 1, 'x', 'error'), 2, 'x', 'success');
    expect(s.visible).toHaveLength(2);
  });

  it('repetido que ainda espera também soma lá', () => {
    let s = EMPTY;
    for (let i = 1; i <= 4; i++) s = add(s, i);
    s = add(s, 9, 'm4');
    expect(s.waiting).toMatchObject([{ id: 4, count: 2 }]);
  });

  it('fechar um id que não existe não muda nada', () => {
    const s = add(EMPTY, 1);
    expect(dismiss(s, 99)).toBe(s);
  });

  it('erro e aviso com botão ficam mais tempo', () => {
    expect(durationOf({ severity: 'success' })).toBe(4000);
    expect(durationOf({ severity: 'error' })).toBe(8000);
    expect(durationOf({ severity: 'info', action: { label: 'Desfazer', onClick: () => {} } })).toBe(8000);
  });
});
