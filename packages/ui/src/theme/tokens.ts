// Mapa de tokens de fora (design system do app, ex.: o do WAAMCP) por cima do visual escolhido. Subconjunto
// tipado de propósito: cor, fundo, texto, borda, raio e fonte. O resto do acabamento continua sendo do tema.

/** Cores de um modo (claro ou escuro). Qualquer cor CSS que o MUI entende: #hex, rgb(), hsl(), color(). */
export interface C3SchemeTokens {
  primary?: string;
  secondary?: string;
  success?: string;
  warning?: string;
  error?: string;
  info?: string;
  /** Fundo da página. */
  background?: string;
  /** Fundo de cartão, diálogo, menu. */
  paper?: string;
  text?: string;
  textSecondary?: string;
  divider?: string;
  /** Barra de cima. Sem isso, acompanha `background` e `text`. */
  headerBg?: string;
  headerFg?: string;
}

export interface C3Tokens {
  light?: C3SchemeTokens;
  dark?: C3SchemeTokens;
  /** Raio dos cantos em px (o `shape.borderRadius` do MUI). */
  radius?: number;
  fontFamily?: string;
  /** `compact` para app de desktop (ver `Density`); sem isso, a de site. */
  density?: 'comfortable' | 'compact';
}

const COLOR = /^(#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})|(rgba?|hsla?|color)\(.+\))$/i;
const COLOR_KEYS = ['primary', 'secondary', 'success', 'warning', 'error', 'info'] as const;

/** Tokens que o MUI não aceitaria (ele quebra a tela com cor inválida). A tela ignora estes e avisa no console. */
export function tokenProblems(tokens: C3Tokens): string[] {
  const out: string[] = [];
  for (const mode of ['light', 'dark'] as const) {
    for (const [key, value] of Object.entries(tokens[mode] ?? {})) {
      if (value !== undefined && !COLOR.test(String(value).trim())) out.push(`${mode}.${key}: "${value}" não é uma cor`);
    }
  }
  if (tokens.radius !== undefined && !(tokens.radius >= 0)) out.push(`radius: ${tokens.radius} não é um raio`);
  return out;
}

type Palette = Record<string, any>;

/** Palette do tema com os tokens do modo por cima; token inválido fica de fora. */
export function withTokens(palette: Palette, t: C3SchemeTokens | undefined): Palette {
  if (!t) return palette;
  const ok = (v?: string): v is string => v !== undefined && COLOR.test(v.trim());
  const out: Palette = { ...palette };
  for (const key of COLOR_KEYS) if (ok(t[key])) out[key] = { main: t[key] };
  if (ok(t.background) || ok(t.paper)) {
    out.background = { ...palette.background, ...(ok(t.background) && { default: t.background }), ...(ok(t.paper) && { paper: t.paper }) };
  }
  if (ok(t.text) || ok(t.textSecondary)) {
    out.text = { ...palette.text, ...(ok(t.text) && { primary: t.text }), ...(ok(t.textSecondary) && { secondary: t.textSecondary }) };
  }
  if (ok(t.divider)) out.divider = t.divider;
  const headerBg = ok(t.headerBg) ? t.headerBg : ok(t.background) ? t.background : undefined;
  const headerFg = ok(t.headerFg) ? t.headerFg : ok(t.text) ? t.text : undefined;
  if (headerBg || headerFg) out.header = { ...palette.header, ...(headerBg && { bg: headerBg }), ...(headerFg && { fg: headerFg }) };
  return out;
}
