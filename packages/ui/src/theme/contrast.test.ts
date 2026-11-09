import { getContrastRatio } from '@mui/material/styles';
import { describe, expect, it } from 'vitest';

import { BRAND_COLORS, createC3Theme, type BrandColor } from './createC3Theme';

const FILLS = ['primary', 'secondary', 'success', 'warning', 'error', 'info'] as const;
const modes = (brand: BrandColor) => {
  const schemes = createC3Theme({ brand }).colorSchemes;
  return [
    ['claro', schemes.light!.palette],
    ['escuro', schemes.dark!.palette]
  ] as const;
};

// WCAG AA para texto normal: 4,5:1 (axe, regra color-contrast)
describe('contraste AA do visual C3', () => {
  for (const brand of Object.keys(BRAND_COLORS) as BrandColor[]) {
    for (const [mode, palette] of modes(brand)) {
      it(`${brand}, ${mode}: texto sobre a cor cheia`, () => {
        for (const key of FILLS) {
          const { main, contrastText } = palette[key];
          expect(getContrastRatio(contrastText, main), `${key} ${main} / ${contrastText}`).toBeGreaterThanOrEqual(4.5);
        }
      });
    }
  }

  it('cores de situação como texto sobre o fundo claro (rótulo com erro, botão de texto e contornado)', () => {
    const { palette } = createC3Theme().colorSchemes.light!;
    // o âmbar como texto usa o tom escuro (variante do MuiButton); os outros, a cor cheia
    const text = [palette.error.main, palette.success.main, palette.info.main, palette.warning.dark];
    for (const color of text) {
      expect(getContrastRatio(color, palette.background.default), color).toBeGreaterThanOrEqual(4.5);
      expect(getContrastRatio(color, palette.background.paper), color).toBeGreaterThanOrEqual(4.5);
    }
  });
});
