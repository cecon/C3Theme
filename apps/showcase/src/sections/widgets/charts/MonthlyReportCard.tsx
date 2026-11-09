import { useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

// third-party
import { LineChart } from '@mui/x-charts/LineChart';

import { Panel } from '@c3theme/ui';
import { MONTHLY_REPORT, MONTHS } from '../data';
import { chartSx, quietAxis } from '../kit/chartSx';
import { formatBRL } from '../kit/format';
import { useChartColors } from '../kit/useChartColors';

const thousand = (v: number | null) => (v === null ? '' : formatBRL(v * 1000, true));

/** Receita, despesas e lucro mês a mês, com escolha do ano. */
export default function MonthlyReportCard() {
  const [year, setYear] = useState('2026');
  const colors = useChartColors();
  const data = MONTHLY_REPORT[year];
  const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

  return (
    <Panel
      title="Relatório mensal"
      action={
        <TextField
          select
          size="small"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          slotProps={{ htmlInput: { 'aria-label': 'Ano' } }}
        >
          {Object.keys(MONTHLY_REPORT).map((y) => (
            <MenuItem key={y} value={y}>
              {y}
            </MenuItem>
          ))}
        </TextField>
      }
    >
      <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 3 }}>
        {[
          { label: 'Receita', value: sum(data.revenue) },
          { label: 'Despesas', value: sum(data.expenses) },
          { label: 'Lucro', value: sum(data.profit) }
        ].map((item) => (
          <Box key={item.label}>
            <Typography variant="body2" color="text.secondary">
              {item.label}
            </Typography>
            <Typography variant="h5" component="p">
              {thousand(item.value)}
            </Typography>
          </Box>
        ))}
      </Stack>
      <Box sx={chartSx}>
        <LineChart
          height={300}
          margin={{ left: 0, right: 8, top: 16, bottom: 0 }}
          xAxis={[{ scaleType: 'point', data: MONTHS.slice(0, data.revenue.length), ...quietAxis }]}
          yAxis={[{ width: 40, ...quietAxis }]}
          series={[
            { data: data.revenue, label: 'Receita', color: colors.primary, curve: 'monotoneX', valueFormatter: thousand },
            { data: data.expenses, label: 'Despesas', color: colors.warning, curve: 'monotoneX', valueFormatter: thousand },
            { data: data.profit, label: 'Lucro', color: colors.success, curve: 'monotoneX', area: true, valueFormatter: thousand }
          ]}
          grid={{ horizontal: true }}
          slotProps={{ legend: { position: { vertical: 'top', horizontal: 'end' } } }}
        />
      </Box>
    </Panel>
  );
}
