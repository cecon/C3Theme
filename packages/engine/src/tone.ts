// Tom semântico da spec → cor da paleta do MUI. `neutral` fica com quem usa: cada tela decide o cinza ou o primário.

import type { Tone } from './types';

export type PaletteColor = 'primary' | 'info' | 'success' | 'warning' | 'error';

export const TONE_PALETTE: Record<Exclude<Tone, 'neutral'>, PaletteColor> = {
  primary: 'primary',
  info: 'info',
  success: 'success',
  warning: 'warning',
  danger: 'error'
};

/** O tom na paleta, com `neutral` virando `fallback`. */
export const paletteOf = <F extends string>(tone: Tone, fallback: F): PaletteColor | F =>
  tone === 'neutral' ? fallback : TONE_PALETTE[tone];
