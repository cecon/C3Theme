import { describe, expect, it } from 'vitest';

import { selectedText } from './BulkBar';

describe('selectedText', () => {
  it('concorda com o gênero e o número', () => {
    expect(selectedText(1)).toBe('1 selecionado');
    expect(selectedText(3)).toBe('3 selecionados');
    expect(selectedText(1, 'f')).toBe('1 selecionada');
    expect(selectedText(2, 'f')).toBe('2 selecionadas');
  });
});
