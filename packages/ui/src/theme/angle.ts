import type { Components, Theme, TypographyVariantsOptions } from '@mui/material/styles';

import type { FieldHeights } from './fieldSize';

/**
 * Visual "Angle": cores, fonte e densidade do template Angle (Bootstrap 4) que sistemas antigos usam,
 * para telas do motor aparecerem dentro deles sem destoar. É uma aproximação no MUI, não uma cópia:
 * mesmos tons e medidas, componentes do MUI.
 */
export const ANGLE = {
  font: `'Source Sans Pro', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`,
  light: {
    primary: '#5D9CEC',
    secondary: '#3A3F51',
    success: '#27C24C',
    warning: '#FF902B',
    error: '#F05050',
    info: '#23B7E5',
    background: { default: '#F5F7FA', paper: '#FFFFFF' },
    text: { primary: '#656565', secondary: '#909FA7' },
    divider: '#DDE6E9',
    // barra de cima azul do Angle ($nav-top-bg = $info), com os itens em branco
    header: { bg: '#23B7E5', fg: '#FFFFFF' }
  },
  // o Angle não tem modo escuro: mesmos tons sobre fundo escuro
  dark: {
    primary: '#7DB1F0',
    secondary: '#A9B3C2',
    success: '#4CD56E',
    warning: '#FFA75A',
    error: '#F47676',
    info: '#4CC6EC',
    background: { default: '#131E26', paper: '#1B2833' },
    text: { primary: '#DDE6E9', secondary: '#909FA7' },
    divider: '#2A3A47',
    header: { bg: '#1B6F8C', fg: '#FFFFFF' }
  }
} as const;

/**
 * Altura dos campos no Angle: o médio tem os 35px do .form-control, o pequeno acompanha o botão pequeno (31px)
 * e o grande (login, telas com poucos campos) fica em 42px.
 */
export const ANGLE_FIELD_HEIGHT: FieldHeights = { small: 31, medium: 35, large: 42 };

/** Acabamento do Angle por cima do da C3: cantos de 3–4px, botão de 35px, cartão sem borda com sombra leve. */
const components: Components<Omit<Theme, 'components'>> = {
  MuiButton: {
    styleOverrides: {
      root: { borderRadius: 3, fontSize: '0.8125rem', fontWeight: 600, paddingInline: 12, minHeight: 35 },
      sizeSmall: { minHeight: 31, fontSize: '0.75rem', paddingInline: 8 }
    }
  },
  MuiIconButton: { styleOverrides: { root: { borderRadius: 3 } } },
  MuiCard: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 4,
        borderColor: 'transparent',
        boxShadow: '0 1px 1px rgb(0 0 0 / 0.05)',
        ...theme.applyStyles('dark', { borderColor: theme.vars.palette.divider, boxShadow: 'none' })
      })
    }
  },
  // painel (Paper outlined) como o .card do Angle: sem borda, sombra de 1px
  MuiPaper: {
    styleOverrides: {
      rounded: { borderRadius: 4 },
      outlined: ({ theme }) => ({
        borderColor: 'transparent',
        boxShadow: '0 1px 1px rgb(0 0 0 / 0.05)',
        ...theme.applyStyles('dark', { borderColor: theme.vars.palette.divider, boxShadow: 'none' })
      })
    }
  },
  MuiDialog: { styleOverrides: { paper: { borderRadius: 4 } } },
  MuiChip: { styleOverrides: { root: { borderRadius: 3 } } },
  MuiAlert: { styleOverrides: { root: { borderRadius: 4 } } },
  MuiTableCell: {
    styleOverrides: {
      // linhas de ~45px, como a .table do Angle (padding .75rem), em vez das de 56px do MUI
      root: ({ theme }) => ({ borderColor: theme.vars.palette.divider, padding: '11px 12px' }),
      sizeSmall: { padding: '6px 12px' },
      paddingCheckbox: { padding: '0 4px' },
      head: ({ theme }) => ({
        fontSize: '0.875rem',
        fontWeight: 600,
        letterSpacing: 0,
        whiteSpace: 'nowrap',
        color: theme.vars.palette.text.primary,
        backgroundColor: 'transparent'
      })
    }
  },
  // menu lateral do Angle: item ativo com a faixa de 3px à esquerda, sem cantos
  MuiListItemButton: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 0,
        borderLeft: '3px solid transparent',
        '&.Mui-selected': { borderLeftColor: theme.vars.palette.info.main, color: theme.vars.palette.info.main },
        '&.Mui-selected .MuiListItemIcon-root': { color: theme.vars.palette.info.main }
      })
    }
  }
};

// corpo em 14px e títulos em negrito, como o typo.scss do Angle
const typography: TypographyVariantsOptions = {
  h1: { fontWeight: 700 },
  h2: { fontWeight: 700 },
  h3: { fontWeight: 700 },
  h4: { fontWeight: 700 },
  body1: { fontSize: '0.875rem' },
  body2: { fontSize: '0.8125rem' }
};

/** Vai por cima do tema da C3 (argumento extra do createTheme, mesclado na ordem). */
export const angleExtras = { components, typography };
