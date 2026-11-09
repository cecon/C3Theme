import { useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import type { Theme } from '@mui/material/styles';

// third-party
import { SparkLineChart } from '@mui/x-charts/SparkLineChart';
import { Add } from 'iconsax-reactjs';

import { notify, Panel } from '@c3theme/ui';
import { PROJECT_OVERVIEW } from '../data';
import { Period } from '../kit/period';
import { PeriodMenu } from '../kit/PeriodMenu';
import Trend from '../kit/Trend';
import { ChartTone, useChartColors } from '../kit/useChartColors';

const TONES: ChartTone[] = ['primary', 'success', 'warning'];

/** Três indicadores de projetos lado a lado, cada um com sua tendência. */
export default function ProjectOverviewCard() {
  const [period, setPeriod] = useState<Period>('mes');
  const colors = useChartColors();
  const wide = useMediaQuery((theme: Theme) => theme.breakpoints.up('md'));

  return (
    <Panel
      title="Visão geral dos projetos"
      action={
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Button
            size="small"
            variant="contained"
            startIcon={<Add size={16} />}
            onClick={() => notify('Projeto criado como rascunho.', 'success')}
            sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
          >
            Novo projeto
          </Button>
          <PeriodMenu value={period} onChange={setPeriod} />
        </Stack>
      }
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        divider={<Divider flexItem orientation={wide ? 'vertical' : 'horizontal'} />}
        spacing={2.5}
      >
        {PROJECT_OVERVIEW[period].map((item, i) => (
          <Box key={item.label} sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" color="text.secondary">
              {item.label}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', mt: 0.5 }}>
              <Typography variant="h4" component="p">
                {item.value}
              </Typography>
              <Trend value={item.change} />
            </Stack>
            <SparkLineChart
              data={item.points}
              height={48}
              curve="natural"
              color={colors.tone(TONES[i])}
              showHighlight
              showTooltip
              margin={{ top: 6, bottom: 6, left: 2, right: 2 }}
            />
          </Box>
        ))}
      </Stack>
    </Panel>
  );
}
