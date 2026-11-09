import { describe, expect, it } from 'vitest';

import { activeTypists, updateTypists } from './typing';

const ana = { id: 'ana', name: 'Ana' };
const bruno = { id: 'bruno', name: 'Bruno' };

describe('quem está digitando', () => {
  it('renova sem duplicar e sai com "parei"', () => {
    let list = updateTypists([], ana, true, 0, 1000);
    list = updateTypists(list, bruno, true, 100, 1000);
    list = updateTypists(list, ana, true, 500, 1000);
    expect(list.map((t) => [t.author.id, t.until])).toEqual([
      ['bruno', 1100],
      ['ana', 1500]
    ]);
    expect(updateTypists(list, bruno, false, 600).map((t) => t.author.id)).toEqual(['ana']);
  });

  it('some sozinho quando vence', () => {
    const list = updateTypists(updateTypists([], ana, true, 0, 1000), bruno, true, 800, 1000);
    expect(activeTypists(list, 1200).map((t) => t.author.id)).toEqual(['bruno']);
  });
});
