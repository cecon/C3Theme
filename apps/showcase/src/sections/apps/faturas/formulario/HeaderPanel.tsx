// Painel com os dados da fatura.
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Controller, useFormContext } from 'react-hook-form';
import { Panel } from '@c3theme/ui';
import { InvoiceStatus, STATUS } from '../data';
import type { FormInput, FormOutput } from './schema';

/** Número, situação, emissão e vencimento. */
export function HeaderPanel() {
  const {
    control,
    register,
    formState: { errors }
  } = useFormContext<FormInput, unknown, FormOutput>();
  return (
    <>
      <Panel title="Dados da fatura">
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              label="Número"
              required
              fullWidth
              {...register('number')}
              error={!!errors.number}
              helperText={errors.number?.message}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <TextField select label="Situação" fullWidth {...field}>
                  {(Object.keys(STATUS) as InvoiceStatus[]).map((k) => (
                    <MenuItem key={k} value={k}>
                      {STATUS[k].label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Controller
              control={control}
              name="issueDate"
              render={({ field, fieldState }) => (
                <DatePicker
                  label="Emissão"
                  value={field.value ?? null}
                  onChange={(d) => field.onChange(d)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      onBlur: field.onBlur,
                      error: !!fieldState.error,
                      helperText: fieldState.error?.message
                    }
                  }}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Controller
              control={control}
              name="dueDate"
              render={({ field, fieldState }) => (
                <DatePicker
                  label="Vencimento"
                  value={field.value ?? null}
                  onChange={(d) => field.onChange(d)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      onBlur: field.onBlur,
                      error: !!fieldState.error,
                      helperText: fieldState.error?.message
                    }
                  }}
                />
              )}
            />
          </Grid>
        </Grid>
      </Panel>
    </>
  );
}
