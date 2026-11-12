import type { CSSObject, Theme } from '@mui/material/styles';
import { accentLuminance, opaqueAccent, parseAccentColor, rgbCss, type Rgb } from './accentColor';

export interface AccentToken {
  start: string;
  end?: string;
}
export type AccentTokens = Record<string, AccentToken>;
export type AccentColor = `accent:${string}`;
export interface AccentPalette {
  start: string;
  end: string;
  background: string;
  contrastText: string;
}
const NAME = /^[a-z][a-z\d_-]*$/i;
export const isAccentColor = (value: string): value is AccentColor => value.startsWith('accent:') && NAME.test(value.slice(7));

export function accentProblems(accents: AccentTokens | undefined, path: string): string[] {
  return Object.entries(accents ?? {}).flatMap(([name, token]) => {
    if (!NAME.test(name)) return [`${path}.${name}: nome de cor inválido`];
    if (!token || !parseAccentColor(token.start) || (token.end !== undefined && !parseAccentColor(token.end)))
      return [`${path}.${name}: start/end precisam ser cores sRGB (#hex, rgb ou hsl)`];
    return [];
  });
}

/** Se necessário, reduz a luminosidade preservando a proporção dos canais (matiz). */
function forWhite(rgb: Rgb): Rgb {
  if (1.05 / (accentLuminance(rgb) + 0.05) >= 4.55) return rgb;
  let low = 0;
  let high = 1;
  for (let i = 0; i < 30; i++) {
    const scale = (low + high) / 2;
    if (1.05 / (accentLuminance(rgb.map((n) => n * scale) as Rgb) + 0.05) >= 4.55) low = scale;
    else high = scale;
  }
  return rgb.map((n) => Math.floor(n * low)) as Rgb;
}

/**
 * Interpolação explicitamente sRGB. Branco: luminância convexa limitada pelos extremos. Preto: o mínimo de
 * cada canal limita por baixo qualquer ponto do gradiente (inclusive o interior). A margem é 4,55:1.
 * Caso nenhum texto sirva, escurece os extremos para branco; não decide contraste só por amostras.
 */
export function compileAccent(token: AccentToken, background: Rgb): AccentPalette {
  let start = opaqueAccent(parseAccentColor(token.start)!, background);
  let end = opaqueAccent(parseAccentColor(token.end ?? token.start)!, background);
  const minimum = start.map((v, i) => Math.min(v, end[i])) as Rgb;
  const black = (accentLuminance(minimum) + 0.05) / 0.05 >= 4.55;
  if (!black) {
    start = forWhite(start);
    end = forWhite(end);
  }
  const a = rgbCss(start);
  const b = rgbCss(end);
  return { start: a, end: b, contrastText: black ? '#000000' : '#FFFFFF', background: `linear-gradient(135deg in srgb, ${a}, ${b})` };
}

export function compileAccents(
  layers: (AccentTokens | undefined)[],
  background: string,
  canvas = '#FFFFFF'
): Record<string, AccentPalette> {
  const page = opaqueAccent(parseAccentColor(canvas) ?? [255, 255, 255, 1], [255, 255, 255]);
  const base = opaqueAccent(parseAccentColor(background) ?? [...page, 1], page);
  const result: Record<string, AccentPalette> = {};
  for (const layer of layers)
    for (const [name, token] of Object.entries(layer ?? {})) {
      if (!accentProblems({ [name]: token }, '').length) result[name] = compileAccent(token, base);
    }
  return result;
}

const warned = new Set<string>();
/** Cor cheia e legível para avatar/selo. Nome ausente volta ao tom normal do componente. */
export function accentColors(theme: Theme, color: AccentColor | undefined): CSSObject | undefined {
  if (!color) return undefined;
  const name = color.slice(7);
  const palette = theme.vars.palette.accents;
  const accent = palette && Object.hasOwn(palette, name) ? palette[name] : undefined;
  if (accent) return { backgroundColor: accent.start, backgroundImage: accent.background, color: accent.contrastText };
  if (!warned.has(color)) {
    console.warn(`[C3Theme] cor nomeada inexistente: ${color}`);
    warned.add(color);
  }
  return undefined;
}
