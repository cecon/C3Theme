// material-ui
import Grid from '@mui/material/Grid';

import { AutocompleteForm, CheckboxForm, LoginForm, RadioForm, SelectForm } from './forms';
import InstantFeedbackForm from './InstantFeedbackForm';

export default function ValidationPage() {
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, lg: 6 }}>
        <LoginForm />
      </Grid>
      <Grid size={{ xs: 12, lg: 6 }}>
        <SelectForm />
      </Grid>
      <Grid size={{ xs: 12, lg: 6 }}>
        <RadioForm />
      </Grid>
      <Grid size={{ xs: 12, lg: 6 }}>
        <CheckboxForm />
      </Grid>
      <Grid size={{ xs: 12, lg: 6 }}>
        <AutocompleteForm />
      </Grid>
      <Grid size={{ xs: 12, lg: 6 }}>
        <InstantFeedbackForm />
      </Grid>
    </Grid>
  );
}
