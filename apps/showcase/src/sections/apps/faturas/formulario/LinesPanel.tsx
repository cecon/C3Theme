// Painel de itens da fatura.
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import FormHelperText from '@mui/material/FormHelperText';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { Add, Trash } from 'iconsax-reactjs';
import { Controller, useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { NumericFormat } from 'react-number-format';
import { Panel } from '@c3theme/ui';
import { money } from '../data';
import { newLine } from './schema';
import type { FormInput, FormOutput } from './schema';

/** Itens da fatura: descrição, quantidade, preço e total por item. */
export function LinesPanel() {
  const {
    control,
    register,
    formState: { errors }
  } = useFormContext<FormInput, unknown, FormOutput>();
  const { fields, append, remove } = useFieldArray({ control, name: 'lines' });
  const lines = useWatch({ control, name: 'lines' });
  return (
    <>
      <Panel title="Itens" flush>
        <Stack divider={<Divider />}>
          {fields.map((f, i) => {
            const e = errors.lines?.[i];
            const line = lines?.[i];
            const lineTotal = (Number(line?.quantity) || 0) * (Number(line?.price) || 0);
            return (
              <Grid key={f.id} container spacing={2} sx={{ px: 2.5, py: 2, alignItems: 'flex-start' }}>
                <Grid size={{ xs: 12, md: 5 }}>
                  <TextField
                    label={`Descrição do item ${i + 1}`}
                    fullWidth
                    required
                    {...register(`lines.${i}.description`)}
                    error={!!e?.description}
                    helperText={e?.description?.message}
                  />
                </Grid>
                <Grid size={{ xs: 4, md: 2 }}>
                  <TextField
                    label="Qtd."
                    type="number"
                    fullWidth
                    {...register(`lines.${i}.quantity`, { valueAsNumber: true })}
                    slotProps={{ htmlInput: { min: 1, step: 1 } }}
                    error={!!e?.quantity}
                    helperText={e?.quantity?.message}
                  />
                </Grid>
                <Grid size={{ xs: 8, md: 2 }}>
                  <Controller
                    control={control}
                    name={`lines.${i}.price`}
                    render={({ field, fieldState }) => (
                      <NumericFormat
                        customInput={TextField}
                        label="Preço unit."
                        fullWidth
                        value={Number.isNaN(field.value) ? '' : field.value}
                        onValueChange={(v) => field.onChange(v.floatValue ?? Number.NaN)}
                        onBlur={field.onBlur}
                        inputRef={field.ref}
                        thousandSeparator="."
                        decimalSeparator=","
                        decimalScale={2}
                        fixedDecimalScale
                        allowNegative={false}
                        inputMode="decimal"
                        slotProps={{ input: { startAdornment: <InputAdornment position="start">R$</InputAdornment> } }}
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 9, md: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Total do item
                  </Typography>
                  <Typography variant="subtitle1">{money(lineTotal)}</Typography>
                </Grid>
                <Grid size={{ xs: 3, md: 1 }} sx={{ textAlign: 'end' }}>
                  <Tooltip title={fields.length === 1 ? 'A fatura precisa de ao menos um item' : 'Remover item'}>
                    <span>
                      <IconButton
                        aria-label={`Remover item ${i + 1}`}
                        color="error"
                        disabled={fields.length === 1}
                        onClick={() => remove(i)}
                        sx={{ mt: 1 }}
                      >
                        <Trash size={18} />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Grid>
              </Grid>
            );
          })}
        </Stack>
        <Divider />
        <Box sx={{ px: 2.5, py: 1.5 }}>
          <Button startIcon={<Add size={18} />} onClick={() => append(newLine())}>
            Adicionar item
          </Button>
          {errors.lines?.root?.message && <FormHelperText error>{errors.lines.root.message}</FormHelperText>}
        </Box>
      </Panel>
    </>
  );
}
