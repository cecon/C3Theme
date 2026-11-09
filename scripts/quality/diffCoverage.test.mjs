import { describe, expect, it } from 'vitest';

import { diffCoverage, formatReport } from './diffCoverage.mjs';

const lcov = new Map([
  [
    'packages/ui/src/a.ts',
    new Map([
      [1, 1],
      [2, 0],
      [3, 0],
      [5, 4]
    ])
  ],
  ['crates/c3-engine/src/v.rs', new Map([[10, 1]])]
]);

describe('diffCoverage', () => {
  it('conta só linha instrumentada de arquivo de produção', () => {
    const changed = new Map([
      ['packages/ui/src/a.ts', [1, 2, 3, 4, 5]],
      ['crates/c3-engine/src/v.rs', [10, 11]],
      ['packages/ui/src/a.test.ts', [1]],
      ['apps/showcase/src/App.tsx', [1]]
    ]);
    const r = diffCoverage(changed, lcov);
    expect(r).toMatchObject({ covered: 3, total: 5, percent: 60, missing: [] });
    expect(r.uncovered).toEqual([{ file: 'packages/ui/src/a.ts', ranges: [[2, 3]] }]);
  });

  it('fonte fora do relatório vai para missing', () => {
    const r = diffCoverage(new Map([['packages/engine/src/b.ts', [1]]]), lcov);
    expect(r).toMatchObject({ total: 0, percent: null, missing: ['packages/engine/src/b.ts'] });
  });
});

describe('formatReport', () => {
  it('mostra o placar e as linhas sem teste', () => {
    const text = formatReport({
      covered: 3,
      total: 5,
      percent: 60,
      uncovered: [
        {
          file: 'packages/ui/src/a.ts',
          ranges: [
            [2, 3],
            [7, 7]
          ]
        }
      ],
      missing: ['packages/engine/src/b.ts']
    });
    expect(text).toBe(
      [
        'cobertura do diff: 3/5 linhas (60.00%), mínimo 80%',
        '  sem teste: packages/ui/src/a.ts: 2-3, 7',
        '  fora do relatório (nenhum teste carrega): packages/engine/src/b.ts'
      ].join('\n')
    );
  });

  it('PR sem código de produção diz isso', () => {
    expect(formatReport({ covered: 0, total: 0, percent: null, uncovered: [], missing: [] })).toBe(
      'cobertura do diff: nenhuma linha de código de produção alterada'
    );
  });
});
