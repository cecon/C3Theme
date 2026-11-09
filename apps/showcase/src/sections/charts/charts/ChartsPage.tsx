// material-ui
import Grid from '@mui/material/Grid';

import { AreaPanel, BarPanel, ColumnPanel, LinePanel, MixedPanel } from './cartesian';
import { GaugePanel, PiePanel, RadarPanel } from './circular';

export default function ChartsPage() {
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, lg: 6 }}>
        <AreaPanel />
      </Grid>
      <Grid size={{ xs: 12, lg: 6 }}>
        <LinePanel />
      </Grid>
      <Grid size={{ xs: 12, lg: 6 }}>
        <ColumnPanel />
      </Grid>
      <Grid size={{ xs: 12, lg: 6 }}>
        <BarPanel />
      </Grid>
      <Grid size={{ xs: 12, lg: 6 }}>
        <MixedPanel />
      </Grid>
      <Grid size={{ xs: 12, lg: 6 }}>
        <RadarPanel />
      </Grid>
      <Grid size={{ xs: 12, lg: 7 }}>
        <PiePanel />
      </Grid>
      <Grid size={{ xs: 12, lg: 5 }}>
        <GaugePanel />
      </Grid>
    </Grid>
  );
}
