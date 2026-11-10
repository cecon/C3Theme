import { describe, expect, it } from 'vitest';

import { acceptsFile, addFiles } from './files';

const f = (name: string, type = '', size = 1) => ({ name, type, size });

describe('anexos', () => {
  it('accept por extensão, tipo exato e família', () => {
    expect(acceptsFile(f('a.PDF'), '.pdf')).toBe(true);
    expect(acceptsFile(f('print.png', 'image/png'), 'image/*, .pdf')).toBe(true);
    expect(acceptsFile(f('nota.txt', 'text/plain'), 'image/*,.pdf')).toBe(false);
    expect(acceptsFile(f('x.json', 'application/json'), 'application/json')).toBe(true);
    expect(acceptsFile(f('qualquer'), undefined)).toBe(true);
  });

  it('não repete nome e tamanho e tira o que o accept recusa', () => {
    const list = [f('a.png', 'image/png', 10)];
    expect(addFiles(list, [f('a.png', 'image/png', 10), f('a.png', 'image/png', 11), f('b.txt', 'text/plain')], 'image/*')).toEqual([
      f('a.png', 'image/png', 10),
      f('a.png', 'image/png', 11)
    ]);
  });
});
