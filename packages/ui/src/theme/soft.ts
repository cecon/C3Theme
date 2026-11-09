import './vars';
import type { CSSObject, Theme } from '@mui/material/styles';

export type Tone = 'neutral' | 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'danger';

const PALETTE = {
  primary: 'primary',
  secondary: 'secondary',
  info: 'info',
  success: 'success',
  warning: 'warning',
  danger: 'error'
} as const;

/** Cor cheia do tom (ponto, borda, texto forte). */
export function toneMain(theme: Theme, tone: Tone): string {
  return tone === 'neutral' ? theme.vars.palette.text.secondary : theme.vars.palette[PALETTE[tone]].main;
}

const darkText = (light: string) => `color-mix(in srgb, ${light} 85%, #fff)`;

/**
 * Texto no tom sobre fundo suave ou transparente: o tom escuro no claro; no escuro, o tom claro puxado 15% para o
 * branco, para passar de 4,5:1 também sobre linha selecionada ou em hover (o tom claro puro dava 4,3:1 no vermelho).
 */
export function toneText(theme: Theme, tone: Tone): CSSObject {
  if (tone === 'neutral') return { color: theme.vars.palette.text.secondary };
  const c = theme.vars.palette[PALETTE[tone]];
  return { color: c.dark, ...theme.applyStyles('dark', { color: darkText(c.light) }) };
}

/** Fundo suave + texto no tom, legível no claro e no escuro. */
export function softColors(theme: Theme, tone: Tone): CSSObject {
  const grey = theme.vars.palette.text.secondary;
  // no escuro, o cinza secundário sobre o fundo de hover fica em 4,3:1: puxado para o branco como os outros tons
  if (tone === 'neutral')
    return { bgcolor: theme.vars.palette.action.hover, color: grey, ...theme.applyStyles('dark', { color: darkText(grey) }) };
  const c = theme.vars.palette[PALETTE[tone]];
  return {
    bgcolor: `rgb(${c.mainChannel} / 0.12)`,
    color: c.dark,
    ...theme.applyStyles('dark', { bgcolor: `rgb(${c.mainChannel} / 0.16)`, color: darkText(c.light) })
  };
}

/** Texto azul do item selecionado (menu): no escuro, o fundo tingido de azul derruba o azul cheio para 4,3:1. */
export function selectedText(theme: Theme): CSSObject {
  return { color: theme.vars.palette.primary.main, ...theme.applyStyles('dark', { color: theme.vars.palette.primary.light }) };
}
