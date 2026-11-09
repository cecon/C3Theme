// material-ui
import Grid from '@mui/material/Grid';

import { DraggableMap, HeatmapMap, InteractionMap } from './ExtraMaps';
import StoresMap from './StoresMap';

export default function MapPage() {
  return (
    <Grid container spacing={3}>
      <Grid size={12}>
        <StoresMap />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <HeatmapMap />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <DraggableMap />
      </Grid>
      <Grid size={12}>
        <InteractionMap />
      </Grid>
    </Grid>
  );
}
