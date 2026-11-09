import { useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Dot, Panel } from '@c3theme/ui';
import { INCOME_BY_CHANNEL, Slice, TOTAL_INCOME } from '../data';
import Donut from '../kit/Donut';
import { formatBRL, formatCompact, formatPercent } from '../kit/format';
import { Period, PERIOD_LABELS } from '../kit/period';
import { PeriodMenu } from '../kit/PeriodMenu';
import { toTone } from '../kit/tone';

const money = (v: number) => formatBRL(v, true);

function Total({ slices, caption }: { slices: Slice[]; caption: string }) {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  return (
    <Box>
      <Typography variant="h4" component="p">
        R$ {formatCompact(total)}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {caption}
      </Typography>
    </Box>
  );
}

function SliceRow({ slice, total }: { slice: Slice; total: number }) {
  return (
    <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
      <Dot tone={toTone(slice.tone)} size={10} />
      <Typography variant="body2" sx={{ flex: 1, minWidth: 0 }} noWrap>
        {slice.label}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {formatPercent((slice.value / total) * 100)}
      </Typography>
      <Typography variant="subtitle2" sx={{ minWidth: 84, textAlign: 'end', flexShrink: 0 }}>
        {money(slice.value)}
      </Typography>
    </Stack>
  );
}

/** Receita por canal de venda em rosca, com troca de período. */
export function IncomeByChannelCard() {
  const [period, setPeriod] = useState<Period>('mes');
  const slices = INCOME_BY_CHANNEL[period];
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  return (
    <Panel title="Receita por canal" subtitle={PERIOD_LABELS[period]} action={<PeriodMenu value={period} onChange={setPeriod} />}>
      <Donut slices={slices} size={210} valueFormatter={money} center={<Total slices={slices} caption="no total" />} />
      <Stack spacing={1.25} sx={{ mt: 2.5 }}>
        {slices.map((s) => (
          <SliceRow key={s.label} slice={s} total={total} />
        ))}
      </Stack>
    </Panel>
  );
}

/** Receita total por linha de produto: rosca ao lado da lista. */
export function TotalIncomeCard() {
  const total = TOTAL_INCOME.reduce((sum, s) => sum + s.value, 0);
  return (
    <Panel title="Receita total" subtitle="Acumulado do ano">
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ alignItems: 'center' }}>
        <Donut slices={TOTAL_INCOME} size={200} valueFormatter={money} center={<Total slices={TOTAL_INCOME} caption="em 2026" />} />
        <Stack spacing={1.5} sx={{ flex: 1, minWidth: 0, width: '100%' }}>
          {TOTAL_INCOME.map((s) => (
            <SliceRow key={s.label} slice={s} total={total} />
          ))}
        </Stack>
      </Stack>
    </Panel>
  );
}
