// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { CloseCircle, TickCircle } from 'iconsax-reactjs';

import { notify, StatusChip } from '@c3theme/ui';
import { Billing, FEATURES, PLANS, price } from './planos';

/** Os três planos lado a lado (usado na página de preços e na landing). */
export default function PlanCards({ billing }: { billing: Billing }) {
  return (
    <Grid container spacing={3} sx={{ alignItems: 'stretch' }}>
      {PLANS.map((plan) => {
        const p = price(plan, billing);
        return (
          <Grid key={plan.id} size={{ xs: 12, md: 4 }}>
            <Paper
              variant="outlined"
              sx={(theme) => ({
                height: '100%',
                borderRadius: 3,
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                ...(plan.popular && { borderColor: 'primary.main', boxShadow: `0 0 0 1px ${theme.vars.palette.primary.main}` })
              })}
            >
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4">{plan.name}</Typography>
                {plan.popular && <StatusChip label="Mais escolhido" tone="primary" />}
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, minHeight: { md: 40 } }}>
                {plan.description}
              </Typography>
              <Stack direction="row" spacing={0.5} sx={{ alignItems: 'baseline', mt: 3 }}>
                <Typography sx={{ fontSize: '2.5rem', fontWeight: 700, lineHeight: 1 }}>{p.perMonth}</Typography>
                <Typography color="text.secondary">/mês</Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ minHeight: 20 }}>
                {p.total}
                {p.saving && ` · economia de ${p.saving}`}
              </Typography>
              <Button
                variant={plan.popular ? 'contained' : 'outlined'}
                size="large"
                fullWidth
                sx={{ mt: 3 }}
                onClick={() => notify(`Plano ${plan.name} (${billing}) selecionado. Checkout simulado.`)}
              >
                Assinar {plan.name}
              </Button>
              <Divider sx={{ my: 3 }} />
              <Stack spacing={1.25}>
                {FEATURES.map((f, i) => {
                  const ok = plan.includes.includes(i);
                  return (
                    <Stack
                      key={f}
                      direction="row"
                      spacing={1.25}
                      sx={{ alignItems: 'center', color: ok ? 'text.primary' : 'text.disabled' }}
                    >
                      <Box sx={{ display: 'flex', color: ok ? 'success.main' : 'text.disabled' }}>
                        {ok ? <TickCircle size={18} variant="Bold" /> : <CloseCircle size={18} />}
                      </Box>
                      <Typography variant="body2" color="inherit" sx={{ textDecoration: ok ? 'none' : 'line-through' }}>
                        {f}
                      </Typography>
                    </Stack>
                  );
                })}
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 'auto', pt: 3 }}>
                {plan.limits.users} · {plan.limits.invoices} · {plan.limits.storage}
              </Typography>
            </Paper>
          </Grid>
        );
      })}
    </Grid>
  );
}
