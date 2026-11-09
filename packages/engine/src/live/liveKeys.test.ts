import { describe, expect, it } from 'vitest';

import type { EntityDef } from '../types';
import { liveKeyOf, nextWait, soundOn } from './liveKeys';

const def = (live: EntityDef['live']) => ({ name: 'ticket', live }) as EntityDef;

describe('liveKeyOf', () => {
  const match = liveKeyOf('ticket');
  it('relê lista, totais, quadro, calendário, relatório e checklist da entidade', () => {
    expect(match(['c3-list', 'ticket', 1, 25])).toBe(true);
    expect(match(['c3-list', 'ticket', 'board', 'new'])).toBe(true);
    expect(match(['c3-checklist', 'ticket', ''])).toBe(true);
  });
  it('não relê formulário aberto, registro único nem outra entidade', () => {
    expect(match(['c3-record', 'ticket', '1'])).toBe(false);
    expect(match(['c3-list', 'ticket', 'singleton'])).toBe(false);
    expect(match(['c3-list', 'note', 1])).toBe(false);
    expect(match('c3-list')).toBe(false);
  });
});

describe('soundOn', () => {
  it('só com live.sound.on', () => {
    expect(soundOn(def(true))).toEqual([]);
    expect(soundOn(def(undefined))).toEqual([]);
    expect(soundOn(def({ sound: { on: ['created'] } }))).toEqual(['created']);
  });
});

describe('nextWait', () => {
  it('dobra até 30 s', () => {
    expect(nextWait(1000)).toBe(2000);
    expect(nextWait(20_000)).toBe(30_000);
    expect(nextWait(30_000)).toBe(30_000);
  });
});
