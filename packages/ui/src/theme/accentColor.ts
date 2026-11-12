/** Cores sRGB explícitas, resolvidas também no servidor (sem canvas ou CSS.supports). */
export type Rgb = [number, number, number];
type Rgba = [number, number, number, number];
const clamp = (n: number, max = 255) => Math.max(0, Math.min(max, n));

export function parseAccentColor(input: unknown): Rgba | undefined {
  if (typeof input !== 'string') return undefined;
  const value = input.trim();
  if (/^#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i.test(value)) {
    let hex = value.slice(1);
    if (hex.length < 5) hex = [...hex].map((c) => c + c).join('');
    return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)).concat(hex.length === 8 ? parseInt(hex.slice(6), 16) / 255 : 1) as Rgba;
  }
  const match = /^(rgba?|hsla?)\(([^()]+)\)$/i.exec(value);
  if (!match) return undefined;
  const parts = match[2].trim().split(/[\s,/]+/);
  if (parts.length < 3 || parts.length > 4 || parts.some((p) => !/^[+-]?(?:\d+\.?\d*|\.\d+)%?$/.test(p) || !Number.isFinite(parseFloat(p))))
    return undefined;
  const number = (p: string, max: number) => clamp(parseFloat(p) * (p.endsWith('%') ? max / 100 : 1), max);
  const alpha = parts[3] === undefined ? 1 : number(parts[3], 1);
  if (match[1].toLowerCase().startsWith('rgb')) return [number(parts[0], 255), number(parts[1], 255), number(parts[2], 255), alpha];
  if (!parts[1].endsWith('%') || !parts[2].endsWith('%') || parts[0].endsWith('%')) return undefined;
  const h = (((parseFloat(parts[0]) % 360) + 360) % 360) / 60;
  const s = number(parts[1], 1);
  const l = number(parts[2], 1);
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h % 2) - 1));
  const rgb = h < 1 ? [c, x, 0] : h < 2 ? [x, c, 0] : h < 3 ? [0, c, x] : h < 4 ? [0, x, c] : h < 5 ? [x, 0, c] : [c, 0, x];
  return [...rgb.map((n) => (n + l - c / 2) * 255), alpha] as Rgba;
}

export function opaqueAccent(color: Rgba, background: Rgb): Rgb {
  return color.slice(0, 3).map((v, i) => Math.round(v * color[3] + background[i] * (1 - color[3]))) as Rgb;
}

/** Luminância WCAG 2.2, sem arredondar o contraste no limiar 4,5:1. */
export function accentLuminance(color: Rgb): number {
  const linear = color.map((n) => n / 255).map((n) => (n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4));
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

export const rgbCss = (rgb: Rgb) => `rgb(${rgb.join(', ')})`;
