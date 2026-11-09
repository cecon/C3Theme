import { useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';

// third-party
import { LineChart } from '@mui/x-charts/LineChart';
import { DocumentDownload } from 'iconsax-reactjs';

import { notify, Panel, SoftIconButton } from '@c3theme/ui';
import { INCOME_OVERVIEW } from '../data';
import { chartSx, quietAxis } from '../kit/chartSx';
import { formatBRL, formatNumber, formatPercent } from '../kit/format';
import Trend from '../kit/Trend';
import { useChartColors } from '../kit/useChartColors';

type Slot = keyof typeof INCOME_OVERVIEW;
type Measure = 'volume' | 'margem' | 'vendas';

const MEASURES: Record<Measure, { label: string; format: (v: number) => string }> = {
  volume: { label: 'Por volume', format: (v) => `${formatNumber(v)} un.` },
  margem: { label: 'Por margem', format: (v) => formatPercent(v) },
  vendas: { label: 'Por vendas', format: (v) => formatBRL(v * 1000, true) }
};

/** Receita por semana ou mês, medida em volume, margem ou vendas; exporta os números em CSV. */
export default function IncomeOverviewCard() {
  const [slot, setSlot] = useState<Slot>('mes');
  const [measure, setMeasure] = useState<Measure>('vendas');
  const colors = useChartColors();
  const { labels, values } = INCOME_OVERVIEW[slot][measure];
  const { format } = MEASURES[measure];
  const last = values.at(-1)!;
  const change = ((last - values.at(-2)!) / values.at(-2)!) * 100;

  function download() {
    const csv = ['periodo;valor', ...labels.map((l, i) => `${l};${values[i]}`)].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `receita-${slot}-${measure}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notify('CSV baixado.', 'success');
  }

  return (
    <Panel title="Visão da receita">
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { md: 'center' } }}>
        <Box>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Typography variant="h3" component="p">
              {format(last)}
            </Typography>
            <Trend value={change} look="chip" />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Comparado {slot === 'mes' ? 'ao mês' : 'ao dia'} anterior
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}>
          <ToggleButtonGroup size="small" exclusive value={slot} onChange={(_, v: Slot | null) => v && setSlot(v)} aria-label="Agrupar por">
            <ToggleButton value="semana" sx={{ px: 2 }}>
              Semana
            </ToggleButton>
            <ToggleButton value="mes" sx={{ px: 2 }}>
              Mês
            </ToggleButton>
          </ToggleButtonGroup>
          <TextField
            select
            size="small"
            value={measure}
            onChange={(e) => setMeasure(e.target.value as Measure)}
            slotProps={{ htmlInput: { 'aria-label': 'Medida' } }}
          >
            {(Object.keys(MEASURES) as Measure[]).map((m) => (
              <MenuItem key={m} value={m}>
                {MEASURES[m].label}
              </MenuItem>
            ))}
          </TextField>
          <SoftIconButton look="outlined" tone="neutral" aria-label="Baixar CSV" onClick={download}>
            <DocumentDownload size={18} />
          </SoftIconButton>
        </Stack>
      </Stack>
      <Box sx={chartSx}>
        <LineChart
          height={300}
          margin={{ left: 0, right: 8, top: 16, bottom: 0 }}
          xAxis={[{ scaleType: 'point', data: labels, ...quietAxis }]}
          yAxis={[{ width: 48, ...quietAxis }]}
          series={[
            {
              data: values,
              label: MEASURES[measure].label,
              area: true,
              curve: 'natural',
              color: colors.primary,
              valueFormatter: (v) => (v === null ? '' : format(v))
            }
          ]}
          grid={{ horizontal: true }}
          hideLegend
        />
      </Box>
    </Panel>
  );
}
