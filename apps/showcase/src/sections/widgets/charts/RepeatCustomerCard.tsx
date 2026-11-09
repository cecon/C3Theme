import { useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { LineChart } from '@mui/x-charts/LineChart';

import { Panel } from '@c3theme/ui';
import { PERIOD_AXIS, REPEAT_RATE } from '../data';
import { chartSx, quietAxis } from '../kit/chartSx';
import { formatPercent } from '../kit/format';
import { Period, PERIOD_LABELS } from '../kit/period';
import { PeriodMenu } from '../kit/PeriodMenu';
import Trend from '../kit/Trend';
import { useChartColors } from '../kit/useChartColors';

/** Taxa de clientes que voltaram a comprar, em área, com troca de período. */
export default function RepeatCustomerCard() {
  const [period, setPeriod] = useState<Period>('mes');
  const colors = useChartColors();
  const data = REPEAT_RATE[period];

  return (
    <Panel title="Taxa de recompra" subtitle={PERIOD_LABELS[period]} action={<PeriodMenu value={period} onChange={setPeriod} />}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <Typography variant="h3" component="p">
          {formatPercent(data.rate)}
        </Typography>
        <Trend value={data.change} look="chip" />
      </Stack>
      <Typography variant="body2" color="text.secondary">
        dos clientes compraram de novo no período
      </Typography>
      <Box sx={chartSx}>
        <LineChart
          height={260}
          margin={{ left: 0, right: 8, top: 16, bottom: 0 }}
          xAxis={[{ scaleType: 'point', data: PERIOD_AXIS[period], ...quietAxis }]}
          yAxis={[{ width: 44, valueFormatter: (v: number) => `${v}%`, ...quietAxis }]}
          series={[
            {
              data: data.series,
              label: 'Recompra',
              area: true,
              curve: 'natural',
              showMark: false,
              color: colors.primary,
              valueFormatter: (v) => (v === null ? '' : formatPercent(v))
            }
          ]}
          grid={{ horizontal: true }}
          hideLegend
        />
      </Box>
    </Panel>
  );
}
