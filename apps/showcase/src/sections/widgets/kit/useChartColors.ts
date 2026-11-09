import { useMemo } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';

export type ChartTone = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';

/**
 * Cores do tema já resolvidas para o modo atual, para os gráficos do @mui/x-charts
 * (que precisam de cores concretas para calcular realces e transparências).
 */
export function useChartColors() {
  const theme = useTheme();
  const { palette } = theme;
  return useMemo(
    () => ({
      primary: palette.primary.main,
      secondary: palette.secondary.main,
      success: palette.success.main,
      warning: palette.warning.main,
      error: palette.error.main,
      info: palette.info.main,
      /** Versão clara do primário, para séries de comparação. */
      primaryLight: palette.primary.light,
      divider: palette.divider,
      text: palette.text.secondary,
      tone: (tone: ChartTone) => palette[tone].main
    }),
    [palette]
  );
}

/** Ordem padrão para gráficos com várias categorias (rosca, barras empilhadas). */
export const CATEGORY_TONES: ChartTone[] = ['primary', 'info', 'success', 'warning', 'error', 'secondary'];
