import { useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { BarChart } from '@mui/x-charts/BarChart';

import { notify, Panel } from '@c3theme/ui';
import { CATEGORY_SALES } from '../data';
import { chartSx, quietAxis } from '../kit/chartSx';
import { formatNumber } from '../kit/format';
import { Period, PERIOD_LABELS } from '../kit/period';
import { PeriodMenu } from '../kit/PeriodMenu';
import { useChartColors } from '../kit/useChartColors';

/** Unidades vendidas por categoria em barras horizontais. */
export default function CategorySalesCard() {
  const [period, setPeriod] = useState<Period>('mes');
  const colors = useChartColors();
  const rows = CATEGORY_SALES[period];
  const total = rows.reduce((sum, r) => sum + r.value, 0);

  return (
    <Panel
      title="Vendas por categoria"
      subtitle={PERIOD_LABELS[period]}
      action={<PeriodMenu value={period} onChange={setPeriod} />}
      footer={
        <Button fullWidth variant="outlined" onClick={() => notify('Abrindo o catálogo de produtos…', 'info')}>
          Ver catálogo
        </Button>
      }
    >
      <Stack direction="row" sx={{ alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Typography variant="h3" component="p">
          {formatNumber(total)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          unidades vendidas
        </Typography>
      </Stack>
      <Box sx={chartSx}>
        <BarChart
          height={280}
          layout="horizontal"
          margin={{ left: 0, right: 24, top: 8, bottom: 0 }}
          borderRadius={6}
          yAxis={[{ scaleType: 'band', data: rows.map((r) => r.label), width: 90, categoryGapRatio: 0.45, ...quietAxis }]}
          xAxis={[{ ...quietAxis, valueFormatter: (v: number) => formatNumber(v) }]}
          series={[{ data: rows.map((r) => r.value), label: 'Unidades', color: colors.info, valueFormatter: (v) => formatNumber(v ?? 0) }]}
          grid={{ vertical: true }}
          hideLegend
        />
      </Box>
    </Panel>
  );
}
