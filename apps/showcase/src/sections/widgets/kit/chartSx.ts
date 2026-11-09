import type { SystemStyleObject } from '@mui/system';
import type { Theme } from '@mui/material/styles';

/** Acabamento comum dos gráficos: área translúcida e eixos discretos. */
export const chartSx: SystemStyleObject<Theme> = {
  '& .MuiLineChart-area': { fillOpacity: 0.16 },
  '& .MuiChartsAxis-line, & .MuiChartsAxis-tick': { display: 'none' },
  '& .MuiChartsAxis-tickLabel': { fill: 'var(--mui-palette-text-secondary)' },
  '& .MuiChartsGrid-line': { strokeDasharray: '4 4' }
};

/** Eixo sem linha nem marcações (o grid já guia a leitura). */
export const quietAxis = { disableLine: true, disableTicks: true } as const;
