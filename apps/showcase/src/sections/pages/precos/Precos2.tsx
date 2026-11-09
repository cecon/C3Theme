import { useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Grid from '@mui/material/Grid';
import Radio from '@mui/material/Radio';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

// third-party
import { CloseCircle, TickCircle } from 'iconsax-reactjs';

import { notify, Panel, ScrollX, StatusChip } from '@c3theme/ui';
import BillingToggle from './BillingToggle';
import { Billing, FEATURES, PLANS, price } from './planos';

/** Preços, versão 2: escolha do plano em lista, resumo do escolhido e tabela comparativa. */
export default function PricingPage2() {
  const [billing, setBilling] = useState<Billing>('anual');
  const [selected, setSelected] = useState('profissional');
  const plan = PLANS.find((p) => p.id === selected)!;
  const current = price(plan, billing);

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', justifyContent: { sm: 'flex-start' } }}>
        <BillingToggle value={billing} onChange={setBilling} />
      </Box>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Panel title="Escolha o plano" sx={{ height: '100%' }}>
            <Stack spacing={1.5} role="radiogroup" aria-label="Planos">
              {PLANS.map((p) => {
                const pr = price(p, billing);
                const active = p.id === selected;
                return (
                  <ButtonBase
                    key={p.id}
                    role="radio"
                    aria-checked={active}
                    onClick={() => setSelected(p.id)}
                    sx={(theme) => ({
                      display: 'flex',
                      textAlign: 'start',
                      alignItems: 'center',
                      gap: 1.5,
                      p: 2,
                      borderRadius: 2,
                      border: 1,
                      borderColor: active ? 'primary.main' : 'divider',
                      bgcolor: active ? `rgb(${theme.vars.palette.primary.mainChannel} / 0.06)` : 'transparent'
                    })}
                  >
                    <Radio checked={active} tabIndex={-1} slotProps={{ input: { 'aria-hidden': true } }} sx={{ p: 0 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" sx={{ alignItems: 'center', flexWrap: 'wrap', columnGap: 1, rowGap: 0.5 }}>
                        <Typography variant="subtitle1">{p.name}</Typography>
                        {p.popular && <StatusChip label="Mais escolhido" tone="primary" />}
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        {p.limits.users} · {p.limits.invoices}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'end', flexShrink: 0 }}>
                      <Typography variant="h5" component="p">
                        {pr.perMonth}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        por mês
                      </Typography>
                    </Box>
                  </ButtonBase>
                );
              })}
            </Stack>
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Panel title={`Plano ${plan.name}`} subtitle={plan.description} sx={{ height: '100%' }}>
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'baseline' }}>
              <Typography sx={{ fontSize: '2.25rem', fontWeight: 700, lineHeight: 1 }}>{current.perMonth}</Typography>
              <Typography color="text.secondary">/mês</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {current.total}
              {current.saving && <Box component="span" sx={{ color: 'success.main' }}>{` · você economiza ${current.saving}`}</Box>}
            </Typography>
            <Stack spacing={1} sx={{ my: 3 }}>
              {FEATURES.filter((_, i) => plan.includes.includes(i)).map((f) => (
                <Stack key={f} direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', color: 'success.main' }}>
                    <TickCircle size={18} variant="Bold" />
                  </Box>
                  <Typography variant="body2">{f}</Typography>
                </Stack>
              ))}
            </Stack>
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={() => notify(`Plano ${plan.name} (${billing}) selecionado. Checkout simulado.`)}
            >
              Continuar com o {plan.name}
            </Button>
          </Panel>
        </Grid>
      </Grid>

      <Panel title="Compare os planos" flush>
        <ScrollX>
          <Table sx={{ minWidth: 600 }} aria-label="Comparação dos planos">
            <TableHead>
              <TableRow>
                <TableCell>Recurso</TableCell>
                {PLANS.map((p) => (
                  <TableCell key={p.id} align="center" sx={p.id === selected ? { color: 'primary.main' } : undefined}>
                    {p.name}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {(['users', 'invoices', 'storage'] as const).map((k) => (
                <TableRow key={k}>
                  <TableCell>{{ users: 'Usuários', invoices: 'Faturas', storage: 'Armazenamento' }[k]}</TableCell>
                  {PLANS.map((p) => (
                    <TableCell key={p.id} align="center">
                      {p.limits[k]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              {FEATURES.map((f, i) => (
                <TableRow key={f}>
                  <TableCell>{f}</TableCell>
                  {PLANS.map((p) => (
                    <TableCell key={p.id} align="center">
                      {p.includes.includes(i) ? (
                        <Box component="span" sx={{ color: 'success.main', display: 'inline-flex' }} aria-label="Incluído">
                          <TickCircle size={18} variant="Bold" />
                        </Box>
                      ) : (
                        <Box component="span" sx={{ color: 'text.disabled', display: 'inline-flex' }} aria-label="Não incluído">
                          <CloseCircle size={18} />
                        </Box>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollX>
      </Panel>
    </Stack>
  );
}
