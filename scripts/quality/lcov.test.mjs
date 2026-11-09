import { describe, expect, it } from 'vitest';

import { mergeLcov, parseLcov } from './lcov.mjs';

const LCOV = [
  'TN:',
  'SF:/repo/packages/ui/src/a.ts',
  'DA:1,1',
  'DA:2,0',
  'DA:2,3',
  'end_of_record',
  'SF:crates/x/src/lib.rs',
  'DA:5,0',
  'end_of_record',
  'DA:9,9'
].join('\n');

describe('parseLcov', () => {
  it('lê as linhas por arquivo, relativo à raiz, somando linha repetida', () => {
    const files = parseLcov(LCOV, '/repo');
    expect([...files.keys()]).toEqual(['packages/ui/src/a.ts', 'crates/x/src/lib.rs']);
    expect(files.get('packages/ui/src/a.ts')).toEqual(
      new Map([
        [1, 1],
        [2, 3]
      ])
    );
    expect(files.get('crates/x/src/lib.rs')).toEqual(new Map([[5, 0]]));
  });

  it('DA fora de um registro é ignorado', () => {
    const files = parseLcov('DA:1,1\nend_of_record', '/repo');
    expect(files.size).toBe(0);
  });

  it('caminho do Windows vira barra normal', () => {
    expect([...parseLcov('SF:packages\\ui\\src\\a.ts\nDA:1,1', '/repo').keys()]).toEqual(['packages/ui/src/a.ts']);
  });
});

describe('mergeLcov', () => {
  it('junta relatórios somando as execuções', () => {
    const a = new Map([['f.ts', new Map([[1, 1]])]]);
    const b = new Map([
      [
        'f.ts',
        new Map([
          [1, 2],
          [2, 0]
        ])
      ],
      ['g.rs', new Map([[3, 1]])]
    ]);
    const merged = mergeLcov(a, b);
    expect(merged.get('f.ts')).toEqual(
      new Map([
        [1, 3],
        [2, 0]
      ])
    );
    expect(merged.get('g.rs')).toEqual(new Map([[3, 1]]));
  });
});
