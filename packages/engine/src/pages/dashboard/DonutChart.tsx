import { PieChart } from '@mui/x-charts/PieChart';

// material-ui
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

import { Dot } from '@c3theme/ui';
import { share } from '../../dashboard';
import type { Tone } from '../../types';
import { TONE_PALETTE } from '../../tone';

/** Rosca com a legenda embaixo: cor, rótulo, % do total e o valor formatado. */
export default function DonutChart({ items }: { items: { label: string; value: number; shown: string; tone?: Tone }[] }) {
  const theme = useTheme();
  const total = items.reduce((s, i) => s + i.value, 0);
  const color = (tone?: Tone) => (!tone || tone === 'neutral' ? theme.palette.text.disabled : theme.palette[TONE_PALETTE[tone]].main);
  return (
    <>
      <PieChart
        height={200}
        hideLegend
        series={[
          {
            innerRadius: 58,
            outerRadius: 92,
            paddingAngle: 2,
            cornerRadius: 4,
            data: items.map((i, n) => ({ id: n, value: i.value, label: i.label, color: color(i.tone) })),
            valueFormatter: (v) => items[Number(v.id)]?.shown ?? ''
          }
        ]}
      />
      <Stack spacing={1.25} sx={{ mt: 2 }}>
        {items.map((i) => (
          <Stack key={i.label} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Dot tone={i.tone ?? 'neutral'} size={10} />
            <Typography variant="body2" sx={{ flex: 1 }}>
              {i.label}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {Math.round(share(i.value, total))}%
            </Typography>
            <Typography variant="subtitle2" sx={{ minWidth: 104, textAlign: 'end' }}>
              {i.shown}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </>
  );
}
