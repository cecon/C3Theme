import { describe, expect, it } from 'vitest';

import type { Message } from '../core/types';
import { buildRows } from './rows';

const m = (id: string, iso: string, author = 'ana', clientId?: string): Message => ({
  id,
  clientId,
  conversationId: 'c1',
  author: { id: author, name: author },
  direction: 'in',
  createdAt: iso
});

describe('linhas do chat', () => {
  it('separa por dia e marca balões seguidos do mesmo autor', () => {
    const rows = buildRows([m('a', '2026-10-29T12:00:00'), m('b', '2026-10-30T12:00:00'), m('c', '2026-10-30T12:01:00')]);
    expect(rows.map((r) => (r.type === 'day' ? 'dia' : `${r.key}${r.grouped ? '+' : ''}`))).toEqual(['dia', 'a', 'dia', 'b', 'c+']);
  });

  it('a chave é o clientId, para a otimista e a confirmada serem a mesma linha', () => {
    expect(buildRows([m('m9', '2026-10-30T12:00:00', 'me', 'tmp1')])[1].key).toBe('tmp1');
  });
});
