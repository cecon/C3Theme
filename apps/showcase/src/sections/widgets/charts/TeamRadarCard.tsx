// material-ui
import Box from '@mui/material/Box';

// third-party
import { RadarChart } from '@mui/x-charts/RadarChart';

import { Panel } from '@c3theme/ui';
import { TEAM_RADAR } from '../data';
import Legend from '../kit/Legend';
import { useChartColors } from '../kit/useChartColors';

/** Avaliação da equipe por critério contra a meta, em radar. */
export default function TeamRadarCard() {
  const colors = useChartColors();
  return (
    <Panel title="Desempenho da equipe" subtitle="Notas de 0 a 100">
      <Legend
        items={[
          { label: 'Atual', tone: 'primary' },
          { label: 'Meta', tone: 'warning' }
        ]}
      />
      <Box>
        <RadarChart
          height={300}
          margin={{ top: 28, bottom: 28, left: 72, right: 72 }}
          radar={{ max: 100, metrics: TEAM_RADAR.metrics }}
          series={[
            { data: TEAM_RADAR.current, label: 'Atual', color: colors.primary, fillArea: true },
            { data: TEAM_RADAR.goal, label: 'Meta', color: colors.warning }
          ]}
          hideLegend
        />
      </Box>
    </Panel>
  );
}
