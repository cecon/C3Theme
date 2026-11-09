import { describe, expect, it } from 'vitest';

import { iconByName } from './context';

const Box = () => null;

describe('iconByName', () => {
  it('acha o ícone no catálogo do sistema', () => {
    expect(iconByName('Box', { Box })).toBe(Box);
  });

  it('nome fora do catálogo, sem nome ou sem catálogo não quebra', () => {
    expect(iconByName('Truck', { Box })).toBeUndefined();
    expect(iconByName('toString', { Box })).toBeUndefined();
    expect(iconByName(undefined, { Box })).toBeUndefined();
    expect(iconByName('Box', undefined)).toBeUndefined();
  });
});
