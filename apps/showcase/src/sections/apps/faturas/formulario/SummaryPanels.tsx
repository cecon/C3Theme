// Observações e resumo da fatura.
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useFormContext, useWatch } from 'react-hook-form';
import { Panel } from '@c3theme/ui';
import { money, totals } from '../data';
import type { FormInput, FormOutput } from './schema';

/** Observações e resumo com desconto, impostos e total. */
export function SummaryPanels() {
  const {
    control,
    register,
    formState: { errors }
  } = useFormContext<FormInput, unknown, FormOutput>();
  const [lines, discount, tax] = useWatch({ control, name: ['lines', 'discount', 'tax'] });
  const t = totals(
    (lines ?? []).map((l) => ({ quantity: Number(l.quantity) || 0, price: Number(l.price) || 0 })),
    Number(discount) || 0,
    Number(tax) || 0
  );
  return (
    <>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Panel title="Observações" sx={{ height: '100%' }}>
            <TextField
              label="Observações para o cliente"
              multiline
              minRows={5}
              fullWidth
              {...register('notes')}
              error={!!errors.notes}
              helperText={errors.notes?.message ?? 'Aparece no rodapé da fatura (até 500 caracteres).'}
            />
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Panel title="Resumo" sx={{ height: '100%' }}>
            <Grid container spacing={2}>
              <Grid size={6}>
                <TextField
                  label="Desconto"
                  type="number"
                  fullWidth
                  {...register('discount', { valueAsNumber: true })}
                  slotProps={{
                    htmlInput: { min: 0, max: 100, step: 0.5 },
                    input: { endAdornment: <InputAdornment position="end">%</InputAdornment> }
                  }}
                  error={!!errors.discount}
                  helperText={errors.discount?.message}
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  label="Impostos"
                  type="number"
                  fullWidth
                  {...register('tax', { valueAsNumber: true })}
                  slotProps={{
                    htmlInput: { min: 0, max: 100, step: 0.5 },
                    input: { endAdornment: <InputAdornment position="end">%</InputAdornment> }
                  }}
                  error={!!errors.tax}
                  helperText={errors.tax?.message}
                />
              </Grid>
            </Grid>
            <Stack spacing={1} sx={{ mt: 2.5 }}>
              {[
                ['Subtotal', money(t.subtotal)],
                ['Desconto', `− ${money(t.discountValue)}`],
                ['Impostos', money(t.taxValue)]
              ].map(([label, value]) => (
                <Stack key={label} direction="row" sx={{ justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    {label}
                  </Typography>
                  <Typography variant="body2">{value}</Typography>
                </Stack>
              ))}
              <Divider />
              <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                <Typography variant="subtitle1">Total</Typography>
                <Typography variant="h4" component="p" color="primary.main">
                  {money(t.total)}
                </Typography>
              </Stack>
            </Stack>
          </Panel>
        </Grid>
      </Grid>
    </>
  );
}
