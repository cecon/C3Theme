import { describe, expect, it } from 'vitest';

import { inlineWidths } from './ChildInlineRows';
import { sideBySide } from './FormSections';
import type { FieldDef } from '../types';

describe('seções lado a lado', () => {
  it('junta seções seguidas com width que cabem em 12', () => {
    const lines = sideBySide([{ title: 'A' }, { title: 'B', width: 7 }, { title: 'C', width: 5 }, { title: 'D', width: 6 }]);
    expect(lines.map((l) => l.map((s) => s.title))).toEqual([['A'], ['B', 'C'], ['D']]);
  });
});

describe('largura dos campos da linha', () => {
  const f = (name: string, type: FieldDef['type']): FieldDef => ({ name, type });
  it('número e conta com 2 colunas; texto divide o resto', () => {
    expect(inlineWidths([f('descricao', 'string'), f('qtd', 'integer'), f('preco', 'decimal')], 1)).toEqual([6, 2, 2]);
  });
  it('sem espaço para o texto, divide igual', () => {
    expect(inlineWidths([f('a', 'integer'), f('b', 'integer'), f('c', 'integer'), f('d', 'integer')], 2)).toEqual([2, 2, 2, 2]);
  });
});
