import type { Components, Theme } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';

import type { FieldHeights } from './fieldSize';

/**
 * Densidade do tema. `comfortable` (padrão) é a de site; `compact` aproxima de app nativo de desktop: texto base de
 * 13px, campos de 28/32/40px, botões, listas, menus e tabelas no tamanho pequeno e cabeçalho de 52px.
 */
export type Density = 'comfortable' | 'compact';

declare module '@mui/material/styles' {
  interface Theme {
    density: Density;
  }
  interface ThemeOptions {
    density?: Density;
  }
}

export const COMPACT_FIELD_HEIGHT: FieldHeights = { small: 28, medium: 32, large: 40 };

/** Altura do cabeçalho do AppLayout por densidade (o `HEADER_HEIGHT` exportado é a de site). */
export const HEADER_HEIGHTS: Record<Density, number> = { comfortable: 64, compact: 52 };

/** Altura do cabeçalho do AppLayout no tema atual, para quem fixa algo logo abaixo dele (barra presa, âncora). */
export function useHeaderHeight(): number {
  return HEADER_HEIGHTS[useTheme().density ?? 'comfortable'];
}

/** O que a densidade compacta muda nos componentes; vai por cima do acabamento do tema (e do Angle). */
export const compactComponents: Components<Omit<Theme, 'components'>> = {
  MuiButton: { defaultProps: { size: 'small' } },
  MuiIconButton: { defaultProps: { size: 'small' } },
  MuiToggleButton: { defaultProps: { size: 'small' } },
  MuiFab: { defaultProps: { size: 'small' } },
  MuiChip: { defaultProps: { size: 'small' } },
  MuiCheckbox: { defaultProps: { size: 'small' } },
  MuiRadio: { defaultProps: { size: 'small' } },
  MuiSwitch: { defaultProps: { size: 'small' } },
  MuiList: { defaultProps: { dense: true } },
  MuiMenuItem: { defaultProps: { dense: true } },
  MuiListItemButton: { defaultProps: { dense: true } },
  MuiTable: { defaultProps: { size: 'small' } },
  MuiTabs: { styleOverrides: { root: { minHeight: 40 } } },
  MuiTab: { styleOverrides: { root: { minHeight: 40, paddingBlock: 8 } } }
};
