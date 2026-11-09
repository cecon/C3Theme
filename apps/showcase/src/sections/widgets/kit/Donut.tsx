import { ReactNode } from 'react';

// material-ui
import Box from '@mui/material/Box';

// third-party
import { PieChart } from '@mui/x-charts/PieChart';

import type { Slice } from '../data';
import { useChartColors } from './useChartColors';

interface DonutProps {
  slices: Slice[];
  size?: number;
  /** Conteúdo no furo da rosca (ex.: total). */
  center?: ReactNode;
  valueFormatter?: (value: number) => string;
}

/** Gráfico de rosca nas cores do tema, com um texto opcional no centro. */
export default function Donut({ slices, size = 200, center, valueFormatter }: DonutProps) {
  const colors = useChartColors();
  return (
    <Box sx={{ position: 'relative', width: size, height: size, mx: 'auto' }}>
      <PieChart
        width={size}
        height={size}
        margin={0}
        hideLegend
        series={[
          {
            data: slices.map((s, i) => ({ id: i, value: s.value, label: s.label, color: colors.tone(s.tone) })),
            innerRadius: size * 0.33,
            outerRadius: size / 2 - 4,
            paddingAngle: 2,
            cornerRadius: 4,
            highlightScope: { fade: 'global', highlight: 'item' },
            faded: { additionalRadius: -4, color: colors.divider },
            valueFormatter: valueFormatter ? (item) => valueFormatter(item.value) : undefined
          }
        ]}
      />
      {center && (
        <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none', textAlign: 'center' }}>
          {center}
        </Box>
      )}
    </Box>
  );
}
