import { describe, expect, it } from 'vitest';

import { answerPart, cancelPart, isPartOpen, stateAfter, type UiPart } from './ui';

const part: UiPart = { id: 'p1', kind: 'c3.form', payload: {} };

describe('partes de interface do assistente', () => {
  it('estado depois de cada resposta', () => {
    expect(stateAfter({ action: 'accept' })).toBe('submitted');
    expect(stateAfter({ action: 'decline' })).toBe('declined');
    expect(stateAfter({ action: 'cancel' })).toBe('cancelled');
    expect(stateAfter({ action: 'undo' })).toBe('undone');
  });

  it('aberta só pendente e dentro do prazo', () => {
    const now = Date.parse('2026-11-03T12:00:00Z');
    expect(isPartOpen(part, now)).toBe(true);
    expect(isPartOpen({ ...part, state: 'submitted' }, now)).toBe(false);
    expect(isPartOpen({ ...part, expiresAt: '2026-11-03T11:59:00Z' }, now)).toBe(false);
    expect(isPartOpen({ ...part, expiresAt: '2026-11-03T12:01:00Z' }, now)).toBe(true);
  });

  it('resposta guarda os valores no resultado', () => {
    expect(answerPart(part, { action: 'accept', values: { motivo: 'x' } })).toMatchObject({ state: 'submitted', result: { motivo: 'x' } });
    expect(answerPart({ ...part, result: { id: '7' } }, { action: 'undo' })).toMatchObject({ state: 'undone', result: { id: '7' } });
  });
});

describe('parte fechada sem resposta', () => {
  it('prazo vira expired; os outros motivos, cancelled', () => {
    expect(cancelPart(part, 'expired')).toMatchObject({ state: 'expired', reason: 'expired' });
    expect(cancelPart(part, 'superseded')).toMatchObject({ state: 'cancelled', reason: 'superseded' });
    expect(cancelPart(part, 'agent')).toMatchObject({ state: 'cancelled', reason: 'agent' });
  });
});
