import { describe, expect, it } from 'vitest';

import { cargoMutantsScore, MUTATION_TARGET, strykerTargets, verdict } from './mutation.mjs';

describe('strykerTargets', () => {
  it('vira faixas por arquivo e deixa de fora teste, app e o que não é TS de pacote', () => {
    const changed = new Map([
      ['packages/ui/src/a.ts', [3, 4, 5, 9]],
      ['packages/ui/src/a.test.ts', [1]],
      ['apps/showcase/src/App.tsx', [1]],
      ['crates/c3-engine/src/lib.rs', [1]],
      ['packages/engine/src/b.tsx', [7]]
    ]);
    expect(strykerTargets(changed)).toEqual(['packages/ui/src/a.ts:3-5', 'packages/ui/src/a.ts:9-9', 'packages/engine/src/b.tsx:7-7']);
  });

  it('PR sem fonte de pacote não tem alvo', () => {
    expect(strykerTargets(new Map([['README.md', [1]]]))).toEqual([]);
  });
});

describe('cargoMutantsScore', () => {
  it('tempo esgotado conta como morto', () => {
    expect(cargoMutantsScore({ caught: 8, missed: 1, timeout: 1 })).toBe(90);
  });

  it('sem mutante válido é null', () => {
    expect(cargoMutantsScore({ caught: 0, missed: 0, timeout: 0 })).toBeNull();
  });
});

describe('verdict', () => {
  it('no piso passa; abaixo reprova', () => {
    expect(verdict(90, MUTATION_TARGET)).toEqual({ ok: true, message: 'placar de mutação 90.00% (piso 90%)' });
    expect(verdict(89.99, 90)).toEqual({ ok: false, message: 'placar de mutação 89.99% abaixo do piso de 90%' });
  });

  it('sem mutante passa e diz por quê', () => {
    expect(verdict(null, 90)).toEqual({ ok: true, message: 'nenhum mutante válido nas linhas alteradas' });
  });
});
