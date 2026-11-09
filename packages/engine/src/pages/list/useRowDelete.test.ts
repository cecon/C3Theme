import { describe, expect, it } from 'vitest';

import { deleteResultText } from './useRowDelete';

describe('deleteResultText', () => {
  it('com falha parcial, conta as que ficaram', () => {
    expect(deleteResultText(2, 5)).toBe('3 de 5 não puderam ser excluídos.');
    expect(deleteResultText(0, 1, 'f')).toBe('1 de 1 não puderam ser excluídas.');
  });

  it('sem falha, conta as excluídas pelo gênero', () => {
    expect(deleteResultText(1, 1)).toBe('Excluído.');
    expect(deleteResultText(1, 1, 'f')).toBe('Excluída.');
    expect(deleteResultText(4, 4, 'f')).toBe('4 excluídas.');
  });
});
