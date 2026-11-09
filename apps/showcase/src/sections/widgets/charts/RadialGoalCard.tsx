// material-ui
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { Gauge, gaugeClasses } from '@mui/x-charts/Gauge';

import Tile from '../kit/Tile';
import { ChartTone, useChartColors } from '../kit/useChartColors';

interface RadialGoalCardProps {
  title: string;
  amount: string;
  /** 0 a 100. */
  percent: number;
  caption: string;
  tone?: ChartTone;
}

/** Anel de progresso de uma meta, com o valor alcançado ao lado. */
export default function RadialGoalCard({ title, amount, percent, caption, tone = 'primary' }: RadialGoalCardProps) {
  const colors = useChartColors();
  return (
    <Tile>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <Box sx={{ flexShrink: 0 }}>
          <Gauge
            width={96}
            height={96}
            value={percent}
            innerRadius="78%"
            cornerRadius="50%"
            text={({ value }) => `${value}%`}
            aria-label={`${title}: ${percent}% da meta`}
            sx={{
              [`& .${gaugeClasses.valueArc}`]: { fill: colors.tone(tone) },
              [`& .${gaugeClasses.referenceArc}`]: { fill: colors.divider },
              [`& .${gaugeClasses.valueText} text`]: { fontWeight: 600, fontSize: 16 }
            }}
          />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
          <Typography variant="h4" component="p">
            {amount}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {caption}
          </Typography>
        </Box>
      </Stack>
    </Tile>
  );
}
