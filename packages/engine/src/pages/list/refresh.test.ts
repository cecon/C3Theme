import { describe, expect, it } from 'vitest';

import { refreshMs } from './useListTotals';

describe('refreshMs', () => {
  it('desligado sem refreshSeconds; segundos em ms; nunca abaixo de 3 s', () => {
    expect(refreshMs(undefined)).toBe(0);
    expect(refreshMs(5)).toBe(5000);
    expect(refreshMs(1)).toBe(3000);
  });
});
