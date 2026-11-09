import { describe, expect, it } from 'vitest';

import { changesBetween, hasMenu, mainActionFor, percentOf } from './providerState';
import type { ProviderItem } from './types';

const p = (status: ProviderItem['status'], progress?: number): ProviderItem => ({ id: 'a', name: 'Codex', status, progress });

describe('providerState', () => {
  it('cada estado tem o botão certo', () => {
    expect(mainActionFor('missing')).toBe('install');
    expect(mainActionFor('needs-login')).toBe('signIn');
    expect(mainActionFor('error')).toBe('retry');
    for (const s of ['installing', 'installed', 'signing-in', 'ready'] as const) expect(mainActionFor(s)).toBeUndefined();
  });

  it('menu só quando o programa está no computador', () => {
    expect(['installed', 'needs-login', 'ready'].every((s) => hasMenu(s as never))).toBe(true);
    expect(['missing', 'installing', 'signing-in', 'error'].some((s) => hasMenu(s as never))).toBe(false);
  });

  it('progresso preso entre 0 e 100 e indeterminado sem valor', () => {
    expect(percentOf(140)).toBe(100);
    expect(percentOf(-3)).toBe(0);
    expect(percentOf(33.6)).toBe(34);
    expect(percentOf(undefined)).toBeUndefined();
    expect(percentOf(NaN)).toBeUndefined();
  });

  it('avisa troca de estado e progresso só ao cruzar 25%', () => {
    expect(changesBetween([p('missing')], [p('installing', 0)])).toEqual([{ kind: 'status', item: p('installing', 0) }]);
    expect(changesBetween([p('installing', 10)], [p('installing', 20)])).toEqual([]);
    expect(changesBetween([p('installing', 20)], [p('installing', 55)])).toEqual([
      { kind: 'progress', item: p('installing', 55), percent: 50 }
    ]);
    expect(changesBetween([p('installing')], [p('installing', 30)])).toHaveLength(1);
    expect(changesBetween([], [p('ready')])).toEqual([]);
  });
});
