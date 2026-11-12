import { createTheme, type Theme } from '@mui/material/styles';

import { ANGLE, ANGLE_FIELD_HEIGHT, angleExtras } from './angle';
import { COMPACT_FIELD_HEIGHT, compactComponents } from './density';
import { C3_FIELD_HEIGHT, fieldSizeComponents, outlinedFieldSize } from './fieldSize';
import { muiLocaleFor } from './muiLocale';
import { scrollbarStyles } from './scrollbar';
import { tokenProblems, withTokens, type C3Tokens } from './tokens';
import { Z_INDEX } from './zIndex';

/** Cores de marca disponíveis. A cor escolhida vira o `primary` nos dois modos. */
export const BRAND_COLORS = {
  blue: { light: '#2563EB', dark: '#5B8DEF' },
  teal: { light: '#0F8B7E', dark: '#3CC3B2' },
  violet: { light: '#6D4AE0', dark: '#9C84F2' },
  orange: { light: '#D9570F', dark: '#F08A4B' },
  graphite: { light: '#3A4556', dark: '#A8B3C4' },
  indigo: { light: '#4F46E5', dark: '#8B85F5' },
  green: { light: '#15803D', dark: '#4ADE80' },
  rose: { light: '#E11D48', dark: '#FB7190' },
  cyan: { light: '#0E7490', dark: '#38BDF8' }
} as const;

export type BrandColor = keyof typeof BRAND_COLORS;

/**
 * Visual do tema. `c3`: o da C3, com a cor de marca escolhida. `angle`: cores, fonte (Source Sans Pro) e densidade
 * do template Angle, para telas do motor dentro de um sistema que usa ele; a cor de marca não vale.
 */
export type Look = 'c3' | 'angle';

export interface C3ThemeOptions {
  look?: Look;
  brand?: BrandColor;
  fontFamily?: string;
  /** Cartões com sombra sobre fundo branco (em vez de borda sobre fundo cinza). */
  contrast?: boolean;
  direction?: 'ltr' | 'rtl';
  /** Tokens do design system do app por cima do visual (cores por modo, raio, fonte). Ver `C3Tokens`. */
  tokens?: C3Tokens;
  /** Idioma do app (`pt-BR`, `en`...): os textos dos componentes do MUI (paginação e outros) seguem ele. */
  locale?: string;
  /** Repassado ao createTheme como argumento extra, por cima de tudo (inclusive do idioma). */
  overrides?: object;
}

/**
 * Contraste mínimo do texto sobre a cor cheia (botão contido, chip cheio, bolha do chat): 4,5:1 do WCAG AA.
 * Abaixo disso o MUI troca o texto branco por escuro (ex.: azul do modo escuro). O Angle fica de fora: copia o Bootstrap.
 */
const AA_CONTRAST = 4.5;

export const DEFAULT_FONT = `'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`;

/** Fontes do painel de preferências. O app carrega as que oferecer (ex.: @fontsource/roboto). */
export const FONT_OPTIONS = [
  { label: 'Inter', value: DEFAULT_FONT },
  { label: 'Roboto', value: `'Roboto', system-ui, sans-serif` },
  { label: 'Public Sans', value: `'Public Sans', system-ui, sans-serif` },
  { label: 'Poppins', value: `'Poppins', system-ui, sans-serif` },
  { label: 'Source Sans Pro', value: ANGLE.font }
] as const;

/**
 * Tema da C3: cores, tipografia e o acabamento dos componentes do MUI.
 * Claro e escuro saem do mesmo tema (colorSchemes + CSS variables), então trocar o modo não recria nada.
 */
export function createC3Theme({
  look = 'c3',
  brand = 'blue',
  fontFamily,
  contrast = false,
  direction = 'ltr',
  tokens,
  locale,
  overrides
}: C3ThemeOptions = {}): Theme {
  const muiLocale = muiLocaleFor(locale);
  const problems = tokens ? tokenProblems(tokens) : [];
  if (problems.length) console.warn(`[c3theme] tokens ignorados: ${problems.join('; ')}`);
  const primary = BRAND_COLORS[brand] ?? BRAND_COLORS.blue;
  const lightBackground = contrast ? '#FFFFFF' : '#F4F6F9';
  const angle = look === 'angle';
  const compact = tokens?.density === 'compact';
  const fields = compact ? COMPACT_FIELD_HEIGHT : angle ? ANGLE_FIELD_HEIGHT : C3_FIELD_HEIGHT;
  const font = fontFamily ?? tokens?.fontFamily ?? (angle ? ANGLE.font : DEFAULT_FONT);
  const anglePalette = (p: (typeof ANGLE)['light' | 'dark']) => ({
    primary: { main: p.primary },
    secondary: { main: p.secondary },
    success: { main: p.success },
    warning: { main: p.warning, contrastText: '#FFFFFF' },
    error: { main: p.error },
    info: { main: p.info, contrastText: '#FFFFFF' },
    background: p.background,
    text: p.text,
    divider: p.divider,
    header: p.header
  });

  return createTheme(
    {
      direction,
      cssVariables: { colorSchemeSelector: 'data-c3-mode' },
      zIndex: Z_INDEX,
      colorSchemes: tokenized(
        angle
          ? { light: { palette: anglePalette(ANGLE.light) }, dark: { palette: anglePalette(ANGLE.dark) } }
          : {
              light: {
                palette: {
                  contrastThreshold: AA_CONTRAST,
                  primary: { main: primary.light },
                  secondary: { main: '#5B6474' },
                  success: { main: '#158146' },
                  warning: { main: '#C77700' },
                  error: { main: '#CF3636' },
                  info: { main: '#0B76B3' },
                  background: { default: lightBackground, paper: '#FFFFFF' },
                  text: { primary: '#141A24', secondary: '#5B6474' },
                  divider: '#E2E6EC',
                  header: { bg: lightBackground, fg: '#141A24' }
                }
              },
              dark: {
                palette: {
                  contrastThreshold: AA_CONTRAST,
                  primary: { main: primary.dark },
                  secondary: { main: '#9AA4B2' },
                  success: { main: '#3DBA74' },
                  warning: { main: '#E5A23B' },
                  error: { main: '#EF6B6B' },
                  info: { main: '#4BA8DE' },
                  background: { default: '#0D1117', paper: '#151B23' },
                  text: { primary: '#E7EBF0', secondary: '#9AA4B2' },
                  divider: '#252D38',
                  header: { bg: '#0D1117', fg: '#E7EBF0' }
                }
              }
            },
        tokens
      ),
      shape: { borderRadius: tokens?.radius !== undefined && tokens.radius >= 0 ? tokens.radius : angle ? 4 : 8 },
      fieldHeight: fields,
      density: compact ? 'compact' : 'comfortable',
      typography: {
        fontFamily: font,
        // o MUI escala todos os tamanhos em rem por este valor (13/14 no compacto)
        fontSize: compact ? 13 : 14,
        h1: { fontSize: '2rem', fontWeight: 600, lineHeight: 1.25 },
        h2: { fontSize: '1.625rem', fontWeight: 600, lineHeight: 1.3 },
        h3: { fontSize: '1.375rem', fontWeight: 600, lineHeight: 1.35 },
        h4: { fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.4 },
        h5: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.5 },
        h6: { fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.5 },
        subtitle1: { fontSize: '0.9375rem', fontWeight: 500 },
        subtitle2: { fontSize: '0.8125rem', fontWeight: 600 },
        body1: { fontSize: '0.9375rem' },
        body2: { fontSize: '0.875rem' },
        caption: { fontSize: '0.75rem' },
        overline: { fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.08em' },
        button: { textTransform: 'none', fontWeight: 600 }
      },
      components: {
        ...fieldSizeComponents(fields),
        MuiCssBaseline: {
          styleOverrides: (theme) => ({
            body: { WebkitFontSmoothing: 'antialiased' },
            ...scrollbarStyles(theme),
            // o MUI copia o rótulo para o entalhe da borda (fieldset aria-hidden); a cópia da interrogação não pode
            // receber foco nem ser clicada. visibility mantém a largura do entalhe e tira o botão da ordem de Tab
            '.MuiOutlinedInput-notchedOutline legend button, .MuiPickersOutlinedInput-notchedOutline legend button': {
              visibility: 'hidden'
            },
            // campos do @mui/x-date-pickers (quando o app usar) com a mesma borda e fundo dos outros campos
            '.MuiPickersOutlinedInput-root': { backgroundColor: theme.vars.palette.background.paper },
            '.MuiPickersOutlinedInput-root:not(.Mui-focused):not(.Mui-error) .MuiPickersOutlinedInput-notchedOutline': {
              borderColor: theme.vars.palette.divider
            },
            '.MuiPickersOutlinedInput-root:hover:not(.Mui-focused):not(.Mui-error) .MuiPickersOutlinedInput-notchedOutline': {
              borderColor: theme.vars.palette.text.secondary
            }
          })
        },
        // o MUI desenha subtitle1/2 como <h6>: viravam títulos soltos (dentro de botão, cartão, lista) e furavam a
        // ordem dos títulos da página. Subtítulo é texto; título de verdade usa h1–h6 ou `component`
        MuiTypography: {
          defaultProps: { variantMapping: { subtitle1: 'p', subtitle2: 'p' } }
        },
        MuiButton: {
          defaultProps: { disableElevation: true },
          styleOverrides: { root: { borderRadius: 8, paddingInline: 16 }, sizeSmall: { paddingInline: 10 } },
          // o âmbar cheio como texto dá 3,2:1 no fundo claro; texto e contorno usam o tom escuro, como os chips
          variants: (['text', 'outlined'] as const).map((variant) => ({
            props: { variant, color: 'warning' as const },
            style: ({ theme }: { theme: Theme }) => ({
              color: theme.vars.palette.warning.dark,
              ...theme.applyStyles('dark', { color: theme.vars.palette.warning.main })
            })
          }))
        },
        MuiIconButton: {
          styleOverrides: { root: { borderRadius: 8 } }
        },
        MuiPaper: {
          defaultProps: { elevation: 0 },
          styleOverrides: {
            // sem o véu claro que o MUI põe nos papéis elevados do modo escuro; a cor vem de background.paper
            root: { backgroundImage: 'none' },
            outlined: ({ theme }) => ({
              borderColor: theme.vars.palette.divider,
              ...(contrast && {
                borderColor: 'transparent',
                boxShadow: '0 1px 2px rgb(16 24 40 / 0.06), 0 4px 12px rgb(16 24 40 / 0.06)',
                ...theme.applyStyles('dark', { borderColor: theme.vars.palette.divider, boxShadow: 'none' })
              })
            })
          }
        },
        MuiCard: {
          defaultProps: { variant: 'outlined' },
          styleOverrides: { root: { borderRadius: 12 } }
        },
        MuiDialog: {
          styleOverrides: { paper: { borderRadius: 12 } }
        },
        MuiOutlinedInput: {
          // entalhe aberto para o rótulo fixo na borda (ver MuiInputLabel em fieldSize); sem rótulo, a largura é zero
          defaultProps: { notched: true },
          styleOverrides: {
            root: ({ theme }) => ({
              ...outlinedFieldSize.root,
              backgroundColor: theme.vars.palette.background.paper,
              '&:hover:not(.Mui-focused):not(.Mui-error) .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.vars.palette.text.secondary
              }
            }),
            input: outlinedFieldSize.input,
            notchedOutline: ({ theme }) => ({ borderColor: theme.vars.palette.divider })
          }
        },
        MuiTableCell: {
          styleOverrides: {
            root: ({ theme }) => ({ borderColor: theme.vars.palette.divider }),
            head: ({ theme }) => ({
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.02em',
              color: theme.vars.palette.text.secondary,
              backgroundColor: theme.vars.palette.background.default,
              whiteSpace: 'nowrap'
            })
          }
        },
        MuiChip: {
          styleOverrides: { root: { borderRadius: 6, fontWeight: 500 } }
        },
        MuiTooltip: {
          defaultProps: { arrow: true },
          styleOverrides: { tooltip: { fontSize: '0.75rem' } }
        },
        MuiListItemButton: {
          styleOverrides: { root: { borderRadius: 8 } }
        },
        MuiAlert: {
          styleOverrides: { root: { borderRadius: 8 } }
        },
        // placeholder parado para quem pediu menos movimento ao sistema
        MuiSkeleton: {
          styleOverrides: {
            root: { '@media (prefers-reduced-motion: reduce)': { animation: 'none', '&::after': { animation: 'none', display: 'none' } } }
          }
        }
      }
    },
    // o que o Angle muda vai por cima (createTheme mescla os argumentos extras na ordem)
    ...(angle ? [angleExtras] : []),
    ...(compact ? [{ components: compactComponents }] : []),
    ...(muiLocale ? [muiLocale] : []),
    ...(overrides ? [overrides] : [])
  );
}

/** Os dois modos com os tokens do app por cima. */
function tokenized<S extends { light: { palette: object }; dark: { palette: object } }>(schemes: S, tokens?: C3Tokens): S {
  if (!tokens) return schemes;
  return {
    ...schemes,
    light: { ...schemes.light, palette: withTokens(schemes.light.palette, tokens.light, [tokens.dark?.accents, tokens.accents]) },
    dark: { ...schemes.dark, palette: withTokens(schemes.dark.palette, tokens.dark, [tokens.light?.accents, tokens.accents]) }
  };
}
