import { useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { BarChart } from '@mui/x-charts/BarChart';

import { Panel } from '@c3theme/ui';
import { SALES_REPORT } from '../data';
import { chartSx, quietAxis } from '../kit/chartSx';
import { formatBRL } from '../kit/format';
import { Period } from '../kit/period';
import { PeriodSelect } from '../kit/PeriodMenu';
import { useChartColors } from '../kit/useChartColors';

const thousand = (v: number | null) => (v === null ? '' : formatBRL(v * 1000, true));

/** Receita e lucro em barras; cada série pode ser ligada ou desligada. */
export default function SalesReportCard() {
  const [period, setPeriod] = useState<Period>('ano');
  const [show, setShow] = useState({ revenue: true, profit: true });
  const colors = useChartColors();
  const data = SALES_REPORT[period];
  const total = data.revenue.reduce((a, b) => a + b, 0);

  const series = [
    show.revenue && { data: data.revenue, label: 'Receita', color: colors.primary, valueFormatter: thousand },
    show.profit && { data: data.profit, label: 'Lucro', color: colors.success, valueFormatter: thousand }
  ].filter((s) => s !== false);

  return (
    <Panel title="Relatório de vendas" action={<PeriodSelect value={period} onChange={setPeriod} />}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}>
        <Box>
          <Typography variant="body2" color="text.secondary">
            Receita no período
          </Typography>
          <Typography variant="h3" component="p">
            {thousand(total)}
          </Typography>
        </Box>
        <Stack direction="row">
          <FormControlLabel
            label="Receita"
            control={<Checkbox checked={show.revenue} onChange={(e) => setShow((s) => ({ ...s, revenue: e.target.checked }))} />}
          />
          <FormControlLabel
            label="Lucro"
            control={
              <Checkbox color="success" checked={show.profit} onChange={(e) => setShow((s) => ({ ...s, profit: e.target.checked }))} />
            }
          />
        </Stack>
      </Stack>
      <Box sx={chartSx}>
        {series.length ? (
          <BarChart
            height={300}
            margin={{ left: 0, right: 0, top: 16, bottom: 0 }}
            borderRadius={4}
            xAxis={[{ scaleType: 'band', data: data.labels, categoryGapRatio: 0.4, ...quietAxis }]}
            yAxis={[{ width: 40, ...quietAxis }]}
            series={series}
            grid={{ horizontal: true }}
            hideLegend
          />
        ) : (
          <Box sx={{ height: 300, display: 'grid', placeItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Marque ao menos uma série para ver o gráfico.
            </Typography>
          </Box>
        )}
      </Box>
    </Panel>
  );
}
