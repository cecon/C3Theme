import { ElementType, useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { SparkLineChart } from '@mui/x-charts/SparkLineChart';

import { SoftAvatar } from '@c3theme/ui';
import { ByPeriod, Period, PERIOD_LABELS } from './period';
import { PeriodMenu } from './PeriodMenu';
import Tile from './Tile';
import { toTone } from './tone';
import Trend from './Trend';
import { ChartTone, useChartColors } from './useChartColors';

export interface KpiPoint {
  /** Valor já formatado (ex.: "R$ 12.400"). */
  value: string;
  /** Variação em % contra o período anterior. */
  change: number;
  /** Série do mini-gráfico. */
  points: number[];
}

export interface KpiCardProps {
  title: string;
  icon: ElementType;
  tone?: ChartTone;
  data: ByPeriod<KpiPoint>;
  chart?: 'area' | 'bar';
  defaultPeriod?: Period;
  /** Quando cair é bom (ex.: cancelamentos). */
  invert?: boolean;
}

/** Cartão de KPI: ícone, valor, variação e mini-gráfico, com menu para trocar o período. */
export default function KpiCard({
  title,
  icon: Icon,
  tone = 'primary',
  data,
  chart = 'area',
  defaultPeriod = 'mes',
  invert
}: KpiCardProps) {
  const [period, setPeriod] = useState<Period>(defaultPeriod);
  const colors = useChartColors();
  const current = data[period];

  return (
    <Tile>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <SoftAvatar tone={toTone(tone)} size="md" variant="rounded">
          <Icon size={20} />
        </SoftAvatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" noWrap>
            {title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {PERIOD_LABELS[period]}
          </Typography>
        </Box>
        <PeriodMenu value={period} onChange={setPeriod} />
      </Stack>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-end', mt: 2 }}>
        <Box sx={{ flex: 1, minWidth: 0, '& .MuiLineChart-area': { fillOpacity: 0.18 } }}>
          <SparkLineChart
            data={current.points}
            height={64}
            plotType={chart === 'bar' ? 'bar' : 'line'}
            area={chart === 'area'}
            curve="natural"
            color={colors.tone(tone)}
            showTooltip
            showHighlight
            margin={{ top: 4, bottom: 4, left: 2, right: 2 }}
          />
        </Box>
        <Stack sx={{ alignItems: 'flex-end', flexShrink: 0 }}>
          <Typography variant="h4" component="p">
            {current.value}
          </Typography>
          <Trend value={current.change} invert={invert} />
        </Stack>
      </Stack>
    </Tile>
  );
}
