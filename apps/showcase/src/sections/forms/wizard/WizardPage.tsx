// material-ui
import Grid from '@mui/material/Grid';

import OrderWizard from './OrderWizard';

export default function WizardPage() {
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, lg: 6 }}>
        <OrderWizard title="Assistente simples" subtitle="Navegue livremente pelas etapas clicando nelas" />
      </Grid>
      <Grid size={{ xs: 12, lg: 6 }}>
        <OrderWizard title="Assistente com validação" subtitle="Cada etapa é conferida antes de avançar" validated />
      </Grid>
    </Grid>
  );
}
