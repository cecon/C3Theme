import { describe, expect, it } from 'vitest';

import { iconByName } from './context';
import fullIcons, { icons } from './icones-completos';

const Box = () => null;

describe('iconByName', () => {
  it('acha o ícone no catálogo do sistema', () => {
    expect(iconByName('Box', { Box })).toBe(Box);
  });

  it('o opt-in entrega o catálogo completo em export default e nomeado', () => {
    expect(fullIcons).toBe(icons);
    expect(iconByName('Box', fullIcons)).toBeTruthy();
    expect(iconByName('Profile2User', fullIcons)).toBeTruthy();
    expect(iconByName('NomeInexistente', fullIcons)).toBeUndefined();
  });

  it('nome fora do catálogo, sem nome ou sem catálogo não quebra', () => {
    expect(iconByName('Truck', { Box })).toBeUndefined();
    expect(iconByName('toString', { Box })).toBeUndefined();
    expect(iconByName(undefined, { Box })).toBeUndefined();
    expect(iconByName('Box', undefined)).toBeUndefined();
  });
});
