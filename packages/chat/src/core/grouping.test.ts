import { describe, expect, it } from 'vitest';

import { continuesGroup, startsDay } from './grouping';
import type { Message } from './types';

const at = (iso: string, author = 'ana', kind?: Message['kind']): Message => ({
  id: iso,
  conversationId: 'c1',
  author: { id: author, name: author },
  direction: 'in',
  createdAt: iso,
  kind
});

describe('agrupamento', () => {
  it('mesmo autor em até 5 minutos continua o bloco', () => {
    expect(continuesGroup(at('2026-10-30T12:00:00'), at('2026-10-30T12:04:59'))).toBe(true);
    expect(continuesGroup(at('2026-10-30T12:00:00'), at('2026-10-30T12:06:00'))).toBe(false);
  });

  it('outro autor, aviso do sistema ou outro dia quebram o bloco', () => {
    expect(continuesGroup(at('2026-10-30T12:00:00'), at('2026-10-30T12:01:00', 'bruno'))).toBe(false);
    expect(continuesGroup(at('2026-10-30T12:00:00', 'ana', 'system'), at('2026-10-30T12:01:00'))).toBe(false);
    expect(continuesGroup(at('2026-10-30T23:59:00'), at('2026-10-31T00:01:00'))).toBe(false);
  });

  it('primeira mensagem e virada do dia (horário local) abrem separador', () => {
    expect(startsDay(undefined, at('2026-10-30T12:00:00'))).toBe(true);
    expect(startsDay(at('2026-10-30T08:00:00'), at('2026-10-30T20:00:00'))).toBe(false);
    expect(startsDay(at('2026-10-30T23:00:00'), at('2026-10-31T01:00:00'))).toBe(true);
  });
});
