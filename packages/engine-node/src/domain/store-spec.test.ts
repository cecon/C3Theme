// Entidade de outro banco (#32): só leitura, scope group, sem reference nem file, banco registrado.
import { describe, expect, it } from 'vitest';

import { parseEntity } from './entity';
import { checkStores, guardWrites } from './store-spec';

const entity = (extra: Record<string, unknown> = {}) =>
  parseEntity({ name: 'log', store: 'logs', fields: [{ name: 'path', type: 'string' }], ...extra })[0];

describe('store', () => {
  it('só leitura, sem cruzar bancos', () => {
    expect(entity().store).toBe('logs');
    expect(() => entity({ store: 'Logs' })).toThrow(/minúsculas/);
    expect(() => entity({ singleton: true })).toThrow(/só leitura/);
    expect(() => entity({ scope: 'company' })).toThrow(/scope/);
    expect(() => entity({ fields: [{ name: 'a', type: 'file' }] })).toThrow(/não cruzam/);
    expect(() => guardWrites(entity())).toThrow(/só leitura/);
  });

  it('banco registrado e ninguém aponta para a entidade', () => {
    const log = entity();
    expect(() => checkStores(new Map([['log', log]]), new Set())).toThrow(/não registrado/);
    const x = parseEntity({ name: 'x', fields: [{ name: 'l', type: 'reference', entity: 'log' }] })[0];
    expect(() =>
      checkStores(
        new Map([
          ['log', log],
          ['x', x]
        ]),
        new Set(['logs'])
      )
    ).toThrow(/referenciada/);
  });
});
