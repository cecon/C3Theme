// Escolha em lista e em opções (select e radio).
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import MenuItem from '@mui/material/MenuItem';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Panel } from '@c3theme/ui';
import { CARGOS, DEPARTAMENTOS, PLANOS } from '../../data';
import { FormActions, fakeSend } from './shared';

// ---------- select ----------

const selectSchema = z.object({
  departamento: z.string().min(1, 'Escolha um departamento.'),
  cargo: z.string().min(1, 'Escolha um cargo.')
});

export function SelectForm() {
  const { control, handleSubmit, reset, formState } = useForm({
    resolver: zodResolver(selectSchema),
    defaultValues: { departamento: '', cargo: '' }
  });

  return (
    <Panel title="Seleção" subtitle="Campos de escolha obrigatórios">
      <Stack
        component="form"
        noValidate
        spacing={2.5}
        onSubmit={handleSubmit((v) => fakeSend(`Lotação: ${v.cargo} em ${v.departamento}.`))}
      >
        <Controller
          name="departamento"
          control={control}
          render={({ field, fieldState }) => (
            <TextField {...field} select label="Departamento" error={!!fieldState.error} helperText={fieldState.error?.message} fullWidth>
              {DEPARTAMENTOS.map((d) => (
                <MenuItem key={d.value} value={d.label}>
                  {d.label}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
        <Controller
          name="cargo"
          control={control}
          render={({ field, fieldState }) => (
            <TextField {...field} select label="Cargo" error={!!fieldState.error} helperText={fieldState.error?.message} fullWidth>
              {CARGOS.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
        <FormActions loading={formState.isSubmitting} onReset={() => reset()} />
      </Stack>
    </Panel>
  );
}

// ---------- radio ----------

const radioSchema = z.object({
  plano: z.string().min(1, 'Escolha um plano para continuar.')
});

export function RadioForm() {
  const { control, handleSubmit, reset, formState } = useForm({ resolver: zodResolver(radioSchema), defaultValues: { plano: '' } });
  const err = formState.errors.plano;

  return (
    <Panel title="Opção única" subtitle="Grupo de rádio obrigatório">
      <Stack component="form" noValidate spacing={2} onSubmit={handleSubmit((v) => fakeSend(`Plano ${v.plano} selecionado.`))}>
        <FormControl error={!!err}>
          <FormLabel id="plano-label">Plano de assinatura</FormLabel>
          <Controller
            name="plano"
            control={control}
            render={({ field }) => (
              <RadioGroup {...field} aria-labelledby="plano-label">
                {PLANOS.map((p) => (
                  <FormControlLabel
                    key={p.value}
                    value={p.label}
                    control={<Radio />}
                    label={
                      <span>
                        {p.label}{' '}
                        <Typography component="span" variant="body2" color="text.secondary">
                          · {p.descricao}
                        </Typography>
                      </span>
                    }
                  />
                ))}
              </RadioGroup>
            )}
          />
          {err && <FormHelperText>{err.message}</FormHelperText>}
        </FormControl>
        <FormActions loading={formState.isSubmitting} onReset={() => reset()} />
      </Stack>
    </Panel>
  );
}
