// Cadastro de cartão.
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import useMediaQuery from '@mui/material/useMediaQuery';
import type { Theme } from '@mui/material/styles';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { PatternFormat } from 'react-number-format';
import { z } from 'zod';
import { CardBrand, SavedCard } from '../data';

const cardSchema = z.object({
  number: z.string().regex(/^\d{16}$/, 'Número com 16 dígitos.'),
  holder: z.string().trim().min(3, 'Nome como está no cartão.'),
  expiry: z
    .string()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Use mm/aa.')
    .refine((v) => {
      const [m, y] = v.split('/').map(Number);
      return new Date(2000 + y!, m!, 1) > new Date();
    }, 'Cartão vencido.'),
  cvv: z.string().regex(/^\d{3,4}$/, 'CVV com 3 ou 4 dígitos.'),
  primary: z.boolean()
});
type CardForm = z.infer<typeof cardSchema>;

const brandOf = (n: string): CardBrand => (n.startsWith('4') ? 'Visa' : n.startsWith('5') || n.startsWith('2') ? 'Mastercard' : 'Elo');

export function AddCardDialog({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (c: SavedCard) => void }) {
  const fullScreen = useMediaQuery((t: Theme) => t.breakpoints.down('sm'));
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<CardForm>({
    resolver: zodResolver(cardSchema),
    defaultValues: { number: '', holder: '', expiry: '', cvv: '', primary: false }
  });

  const submit = async (v: CardForm) => {
    await new Promise((r) => setTimeout(r, 500));
    onAdd({
      id: `k${Date.now()}`,
      brand: brandOf(v.number),
      holder: v.holder.toUpperCase(),
      last4: v.number.slice(-4),
      expiry: v.expiry,
      primary: v.primary
    });
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" fullScreen={fullScreen}>
      <Box component="form" onSubmit={handleSubmit(submit)} noValidate>
        <DialogTitle>Adicionar cartão</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid size={12}>
              <Controller
                control={control}
                name="number"
                render={({ field, fieldState }) => (
                  <PatternFormat
                    format="#### #### #### ####"
                    customInput={TextField}
                    label="Número do cartão"
                    fullWidth
                    autoComplete="cc-number"
                    inputMode="numeric"
                    value={field.value}
                    onValueChange={(v) => field.onChange(v.value)}
                    onBlur={field.onBlur}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                label="Nome impresso"
                fullWidth
                autoComplete="cc-name"
                {...register('holder')}
                error={!!errors.holder}
                helperText={errors.holder?.message}
              />
            </Grid>
            <Grid size={6}>
              <Controller
                control={control}
                name="expiry"
                render={({ field, fieldState }) => (
                  <PatternFormat
                    format="##/##"
                    customInput={TextField}
                    label="Validade"
                    placeholder="mm/aa"
                    fullWidth
                    autoComplete="cc-exp"
                    inputMode="numeric"
                    value={field.value}
                    onValueChange={(v) => field.onChange(v.formattedValue.trim())}
                    onBlur={field.onBlur}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Grid>
            <Grid size={6}>
              <TextField
                label="CVV"
                fullWidth
                autoComplete="cc-csc"
                {...register('cvv')}
                slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 4 } }}
                error={!!errors.cvv}
                helperText={errors.cvv?.message}
              />
            </Grid>
            <Grid size={12}>
              <Controller
                control={control}
                name="primary"
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                    label="Usar como cartão principal"
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button color="inherit" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" loading={isSubmitting}>
            Salvar cartão
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
