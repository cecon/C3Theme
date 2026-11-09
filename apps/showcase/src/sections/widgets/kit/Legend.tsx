// material-ui
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Dot } from '@c3theme/ui';
import { toTone } from './tone';
import type { ChartTone } from './useChartColors';

/** Legenda simples de pontinhos, para gráficos com a legenda própria escondida. */
export default function Legend({ items }: { items: { label: string; tone: ChartTone }[] }) {
  return (
    <Stack direction="row" sx={{ flexWrap: 'wrap', columnGap: 2, rowGap: 0.5 }}>
      {items.map((item) => (
        <Stack key={item.label} direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
          <Dot tone={toTone(item.tone)} size={10} />
          <Typography variant="caption" color="text.secondary">
            {item.label}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}
