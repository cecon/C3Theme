// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { blankPreferences, moveId, ordered, readPreferences, savePreferences, toggleId, visibleCards } from './preferences';
afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});
it('preferência inválida ou indisponível não derruba a lista nem injeta valores sem tipo', () => {
  localStorage.setItem('c3.sidebar.x', '{');
  expect(readPreferences('x')).toEqual(blankPreferences());
  localStorage.setItem(
    'c3.sidebar.x',
    JSON.stringify({
      collapsed: ['a', null, 5],
      sections: [null, { id: 'a', label: 'A' }, { id: 4 }],
      moved: { a: 'b', bad: 3 },
      names: { a: 'A' }
    })
  );
  const value = readPreferences('x');
  expect(value.collapsed).toEqual(['a']);
  expect(value.sections).toEqual([{ id: 'a', label: 'A' }]);
  expect(value.moved).toEqual({ a: 'b' });
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw Error();
  });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw Error();
  });
  expect(readPreferences('x')).toEqual(blankPreferences());
  expect(() => savePreferences('x', blankPreferences())).not.toThrow();
});
it('ordenação parcial preserva novos dados; limites e IDs ausentes não removem itens', () => {
  expect(ordered([{ id: 'a' }, { id: 'b' }, { id: 'c' }], ['b']).map((v) => v.id)).toEqual(['b', 'a', 'c']);
  expect(moveId(['a', 'b'], 'a', -1)).toEqual(['a', 'b']);
  expect(moveId(['a', 'b'], 'b', 1)).toEqual(['a', 'b']);
  expect(moveId(['a'], 'missing', 1)).toEqual(['a']);
  expect(toggleId(['a'], 'a')).toEqual([]);
  expect(toggleId([], 'b')).toEqual(['b']);
});
it('dispensa não esconde dados de outro servidor e só um alerta é escolhido', () => {
  const cards = [
    { id: 'w1', label: 'W', severity: 'warning' as const, action: { id: 'go', label: 'Go' } },
    { id: 'w2', label: 'W2', severity: 'warning' as const, action: { id: 'go', label: 'Go' } }
  ];
  expect(visibleCards(cards, []).map((v) => v.id)).toEqual(['w1']);
  expect(visibleCards(cards, ['w1']).map((v) => v.id)).toEqual(['w2']);
  expect(visibleCards([], [])).toEqual([]);
});
