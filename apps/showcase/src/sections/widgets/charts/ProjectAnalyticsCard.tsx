import { useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';

// third-party
import { BarChart } from '@mui/x-charts/BarChart';

import { Panel } from '@c3theme/ui';
import { MONTHS, PROJECT_ANALYTICS } from '../data';
import { chartSx, quietAxis } from '../kit/chartSx';
import Legend from '../kit/Legend';
import { Period } from '../kit/period';
import { PeriodSelect } from '../kit/PeriodMenu';
import Trend from '../kit/Trend';
import { useChartColors } from '../kit/useChartColors';

type AreaKey = keyof typeof PROJECT_ANALYTICS;

// quantos meses mostrar em cada período
const WINDOW: Partial<Record<Period, number>> = { semana: 4, mes: 6, ano: 12 };

/** Comparação ano atual x anterior por área, com abas e janela de meses. */
export default function ProjectAnalyticsCard() {
  const [tab, setTab] = useState<AreaKey>('geral');
  const [period, setPeriod] = useState<Period>('ano');
  const colors = useChartColors();
  const data = PROJECT_ANALYTICS[tab];
  const size = WINDOW[period] ?? 12;
  const slice = <T,>(values: T[]) => values.slice(12 - size);

  return (
    <Panel flush>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        sx={{ px: 2.5, pt: 1, alignItems: { sm: 'center' }, justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider' }}
      >
        <Tabs value={tab} onChange={(_, v: AreaKey) => setTab(v)} variant="scrollable" allowScrollButtonsMobile aria-label="Área analisada">
          {Object.entries(PROJECT_ANALYTICS).map(([key, value]) => (
            <Tab key={key} value={key} label={value.label} id={`analise-tab-${key}`} aria-controls="analise-painel" />
          ))}
        </Tabs>
        <Box sx={{ pb: { xs: 1.5, sm: 0 } }}>
          <PeriodSelect value={period} onChange={setPeriod} options={['semana', 'mes', 'ano']} />
        </Box>
      </Stack>
      <Grid container id="analise-painel" role="tabpanel" aria-labelledby={`analise-tab-${tab}`}>
        <Grid size={{ xs: 12, md: 8 }} sx={{ p: 2.5 }}>
          <Legend
            items={[
              { label: '2026', tone: 'primary' },
              { label: '2025', tone: 'secondary' }
            ]}
          />
          <Box sx={chartSx}>
            <BarChart
              height={300}
              margin={{ left: 0, right: 0, top: 16, bottom: 0 }}
              borderRadius={4}
              xAxis={[{ scaleType: 'band', data: slice(MONTHS), categoryGapRatio: 0.35, barGapRatio: 0.15, ...quietAxis }]}
              yAxis={[{ width: 40, ...quietAxis }]}
              series={[
                { data: slice(data.current), label: '2026', color: colors.primary },
                { data: slice(data.previous), label: '2025', color: colors.secondary }
              ]}
              grid={{ horizontal: true }}
              hideLegend
            />
          </Box>
        </Grid>
        <Grid
          size={{ xs: 12, md: 4 }}
          sx={(theme) => {
            const line = `1px solid ${theme.vars.palette.divider}`;
            return { borderTop: { xs: line, md: 'none' }, borderInlineStart: { md: line } };
          }}
        >
          {data.stats.map((s, i) => (
            <Box key={s.label} sx={{ p: 2.5, borderTop: i ? 1 : 0, borderColor: 'divider' }}>
              <Typography variant="body2" color="text.secondary">
                {s.label}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', justifyContent: 'space-between' }}>
                <Typography variant="h4" component="p">
                  {s.value}
                </Typography>
                <Trend value={s.change} invert={s.invert} />
              </Stack>
            </Box>
          ))}
        </Grid>
      </Grid>
    </Panel>
  );
}
