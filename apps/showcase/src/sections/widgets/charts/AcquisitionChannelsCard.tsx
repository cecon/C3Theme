// material-ui
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { BarChart } from '@mui/x-charts/BarChart';
import { Global, Link21, Profile2User } from 'iconsax-reactjs';

import { Panel, SoftAvatar, Tone } from '@c3theme/ui';
import { ACQUISITION } from '../data';
import { chartSx, quietAxis } from '../kit/chartSx';
import { formatBRL, formatNumber } from '../kit/format';
import Legend from '../kit/Legend';
import Trend from '../kit/Trend';
import { useChartColors } from '../kit/useChartColors';

const ICONS = [Global, Link21, Profile2User];
const TONES: Tone[] = ['primary', 'info', 'success'];

/** De onde vêm os visitantes: barras empilhadas por mês e os canais que mais trazem receita. */
export default function AcquisitionChannelsCard() {
  const colors = useChartColors();
  const total = ACQUISITION.organic.at(-1)! + ACQUISITION.paid.at(-1)! + ACQUISITION.social.at(-1)!;

  return (
    <Panel title="Canais de aquisição" subtitle="Visitas (mil) por origem" flush>
      <Box sx={{ px: 2.5, pt: 2 }}>
        <Stack direction="row" sx={{ alignItems: 'baseline', justifyContent: 'space-between' }}>
          <Typography variant="h3" component="p">
            {formatNumber(total * 1000)}
          </Typography>
          <Trend value={6.8} />
        </Stack>
        <Legend
          items={[
            { label: 'Orgânico', tone: 'primary' },
            { label: 'Pago', tone: 'info' },
            { label: 'Social', tone: 'success' }
          ]}
        />
        <Box sx={chartSx}>
          <BarChart
            height={200}
            margin={{ left: 0, right: 0, top: 12, bottom: 0 }}
            xAxis={[{ scaleType: 'band', data: ACQUISITION.months, categoryGapRatio: 0.45, ...quietAxis }]}
            yAxis={[{ width: 32, ...quietAxis }]}
            series={[
              { data: ACQUISITION.organic, label: 'Orgânico', stack: 'total', color: colors.primary },
              { data: ACQUISITION.paid, label: 'Pago', stack: 'total', color: colors.info },
              { data: ACQUISITION.social, label: 'Social', stack: 'total', color: colors.success }
            ]}
            hideLegend
          />
        </Box>
      </Box>
      <List disablePadding sx={{ mt: 1 }}>
        {ACQUISITION.channels.map((c, i) => {
          const Icon = ICONS[i];
          return (
            <ListItem
              key={c.label}
              divider={i < ACQUISITION.channels.length - 1}
              sx={{ px: 2.5, borderTop: i ? 0 : 1, borderColor: 'divider' }}
            >
              <ListItemAvatar>
                <SoftAvatar tone={TONES[i]} size="sm">
                  <Icon size={16} />
                </SoftAvatar>
              </ListItemAvatar>
              <ListItemText primary={c.label} secondary={c.detail} />
              <Stack sx={{ alignItems: 'flex-end' }}>
                <Typography variant="subtitle2">+ {formatBRL(c.value, true)}</Typography>
                <Trend value={c.change} />
              </Stack>
            </ListItem>
          );
        })}
      </List>
    </Panel>
  );
}
