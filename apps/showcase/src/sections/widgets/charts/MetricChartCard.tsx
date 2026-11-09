import { useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { BarChart } from '@mui/x-charts/BarChart';
import { Gauge, gaugeClasses } from '@mui/x-charts/Gauge';
import { LineChart } from '@mui/x-charts/LineChart';

import { notify } from '@c3theme/ui';
import { PERIOD_AXIS } from '../data';
import { chartSx } from '../kit/chartSx';
import { formatNumber } from '../kit/format';
import { ByPeriod, Period } from '../kit/period';
import { PeriodSelect } from '../kit/PeriodMenu';
import Tile from '../kit/Tile';
import Trend from '../kit/Trend';
import { ChartTone, useChartColors } from '../kit/useChartColors';

type MetricChartCardProps = {
  title: string;
  tone?: ChartTone;
  change: ByPeriod<number>;
} & ({ chart: 'gauge'; percent: ByPeriod<number>; caption: string } | { chart: 'bar' | 'line'; series: ByPeriod<number[]>; unit: string });

/** Cartão de métrica com seletor de período e um gráfico (anel, barras ou linha). */
export default function MetricChartCard(props: MetricChartCardProps) {
  const { title, tone = 'primary', change } = props;
  const [period, setPeriod] = useState<Period>('semana');
  const colors = useChartColors();
  const color = colors.tone(tone);

  let headline: string;
  let chart;
  if (props.chart === 'gauge') {
    const value = props.percent[period];
    headline = `${value}% ${props.caption}`;
    chart = (
      <Gauge
        height={170}
        value={value}
        startAngle={-110}
        endAngle={110}
        innerRadius="76%"
        cornerRadius="50%"
        text={({ value: v }) => `${v}%`}
        aria-label={`${title}: ${value}%`}
        sx={{
          [`& .${gaugeClasses.valueArc}`]: { fill: color },
          [`& .${gaugeClasses.referenceArc}`]: { fill: colors.divider },
          [`& .${gaugeClasses.valueText} text`]: { fontSize: 26, fontWeight: 600 }
        }}
      />
    );
  } else {
    const data = props.series[period];
    const total = Math.round(data.reduce((sum, v) => sum + v, 0));
    headline = `${formatNumber(total)} ${props.unit}`;
    const common = {
      height: 170,
      margin: { left: 0, right: 0, top: 8, bottom: 0 },
      xAxis: [{ scaleType: 'band' as const, data: PERIOD_AXIS[period], position: 'none' as const }],
      yAxis: [{ position: 'none' as const }],
      hideLegend: true
    };
    chart =
      props.chart === 'bar' ? (
        <BarChart {...common} borderRadius={4} series={[{ data, color, label: title }]} />
      ) : (
        <LineChart
          {...common}
          xAxis={[{ scaleType: 'point', data: PERIOD_AXIS[period], position: 'none' }]}
          series={[{ data, color, label: title, area: true, curve: 'natural', showMark: false }]}
        />
      );
  }

  return (
    <Tile
      footer={
        <Button fullWidth variant="outlined" onClick={() => notify(`Relatório de ${title.toLowerCase()} enviado para seu e-mail.`, 'info')}>
          Ver relatório
        </Button>
      }
    >
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5" noWrap>
          {title}
        </Typography>
        <PeriodSelect value={period} onChange={setPeriod} />
      </Stack>
      <Box sx={{ ...chartSx, my: 1 }}>{chart}</Box>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="subtitle1">{headline}</Typography>
        <Trend value={change[period]} />
      </Stack>
    </Tile>
  );
}
