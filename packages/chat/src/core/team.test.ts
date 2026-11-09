import { describe, expect, it } from 'vitest';

import { continuesGroup } from './grouping';
import { APPROVAL, approvalAnswer, approvalChoice, isAgent, latestBlocks, stateFor } from './team';
import type { Author, Message } from './types';

const at = (min: number) => new Date(Date.UTC(2026, 10, 8, 13, min)).toISOString();
const ATENDENTE: Author = { id: 'at', name: 'Atendente', kind: 'agent' };
const COZINHA: Author = { id: 'co', name: 'Cozinha', kind: 'agent' };
const msg = (id: string, author: Author, min: number, extra: Partial<Message> = {}): Message => ({
  id,
  conversationId: 'c',
  author,
  direction: 'in',
  text: id,
  createdAt: at(min),
  ...extra
});

describe('aprovação', () => {
  it('cada escolha vira a opção certa e volta', () => {
    expect(approvalAnswer('always')).toEqual({ optionIds: [APPROVAL.always] });
    expect(approvalChoice(approvalAnswer('once'))).toBe('once');
    expect(approvalChoice(approvalAnswer('decline'))).toBe('decline');
  });
  it('dispensar conta como recusa; sem resposta ou opção estranha, nada', () => {
    expect(approvalChoice({ dismissed: true })).toBe('decline');
    expect(approvalChoice(undefined)).toBeUndefined();
    expect(approvalChoice({ optionIds: ['outra'] })).toBeUndefined();
  });
});

describe('vários agentes', () => {
  it('isAgent só com kind agent', () => {
    expect(isAgent(ATENDENTE)).toBe(true);
    expect(isAgent({ id: 'x', name: 'X' })).toBe(false);
  });

  it('a passagem de tarefa quebra o bloco', () => {
    const a = msg('1', ATENDENTE, 0);
    const h = msg('h', ATENDENTE, 0, { kind: 'handoff', handoff: { from: ATENDENTE, to: COZINHA, task: 'confirmar' } });
    expect(continuesGroup(a, h)).toBe(false);
    expect(continuesGroup(h, msg('2', ATENDENTE, 1))).toBe(false);
  });

  it('o estado vale só no último bloco de cada autor', () => {
    const list = [msg('1', ATENDENTE, 0), msg('2', ATENDENTE, 1), msg('3', COZINHA, 2), msg('4', ATENDENTE, 3), msg('5', ATENDENTE, 3)];
    const latest = latestBlocks(list);
    const states = { at: 'working', co: 'waiting' } as const;
    expect(list.map((m) => stateFor(m, states, latest))).toEqual([undefined, undefined, 'waiting', 'working', 'working']);
    expect(stateFor(list[0], undefined, latest)).toBeUndefined();
  });
});
