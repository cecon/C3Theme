import Grid from '@mui/material/Grid';
import { EdicaoPorCelula } from './editavel/PorCelula';
import { EdicaoPorLinha } from './editavel/PorLinha';

export default function DadosEditavel() {
  return (
    <Grid container spacing={3}>
      <Grid size={12}>
        <EdicaoPorCelula />
      </Grid>
      <Grid size={12}>
        <EdicaoPorLinha />
      </Grid>
    </Grid>
  );
}
