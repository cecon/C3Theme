// Painel de preço e estoque.
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import { Controller, useFormContext } from 'react-hook-form';
import { NumericFormat } from 'react-number-format';
import { Panel } from '@c3theme/ui';
import type { FormValues } from './schema';

function MoneyField({
  label,
  value,
  onChange,
  error,
  helperText
}: {
  label: string;
  value?: number;
  onChange: (v?: number) => void;
  error?: boolean;
  helperText?: string;
}) {
  return (
    <NumericFormat
      customInput={TextField}
      label={label}
      fullWidth
      value={value ?? ''}
      onValueChange={(v) => onChange(v.floatValue)}
      thousandSeparator="."
      decimalSeparator=","
      decimalScale={2}
      fixedDecimalScale
      allowNegative={false}
      error={error}
      helperText={helperText}
      slotProps={{ input: { startAdornment: <InputAdornment position="start">R$</InputAdornment> } }}
    />
  );
}

/** Preço, preço antigo e estoque. */
export function PricePanel() {
  const {
    control,
    formState: { errors }
  } = useFormContext<FormValues>();
  return (
    <>
      <Panel title="Preço e estoque">
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Controller
              control={control}
              name="preco"
              render={({ field }) => (
                <MoneyField
                  label="Preço de venda"
                  value={field.value}
                  onChange={field.onChange}
                  error={!!errors.preco}
                  helperText={errors.preco?.message}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Controller
              control={control}
              name="precoAntigo"
              render={({ field }) => (
                <MoneyField
                  label="Preço “de” (opcional)"
                  value={field.value}
                  onChange={field.onChange}
                  error={!!errors.precoAntigo}
                  helperText={errors.precoAntigo?.message ?? 'Mostra o desconto na vitrine.'}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Controller
              control={control}
              name="estoque"
              render={({ field }) => (
                <NumericFormat
                  customInput={TextField}
                  label="Estoque"
                  fullWidth
                  decimalScale={0}
                  allowNegative={false}
                  thousandSeparator="."
                  decimalSeparator=","
                  value={field.value ?? ''}
                  onValueChange={(v) => field.onChange(v.floatValue)}
                  error={!!errors.estoque}
                  helperText={errors.estoque?.message ?? 'Unidades disponíveis.'}
                />
              )}
            />
          </Grid>
        </Grid>
      </Panel>
    </>
  );
}
