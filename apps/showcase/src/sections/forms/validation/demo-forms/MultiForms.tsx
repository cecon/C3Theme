// Várias escolhas (checkbox e autocomplete).
import Autocomplete from '@mui/material/Autocomplete';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Panel } from '@c3theme/ui';
import { CIDADES, INTERESSES, TECNOLOGIAS } from '../../data';
import type { Cidade } from '../../data';
import { FormActions, fakeSend } from './shared';

// ---------- checkbox ----------

const checkboxSchema = z.object({
  interesses: z.array(z.string()).min(2, 'Marque pelo menos dois interesses.'),
  termos: z.boolean().refine((v) => v, 'É preciso aceitar os termos de uso.')
});

export function CheckboxForm() {
  const { control, handleSubmit, reset, formState } = useForm({
    resolver: zodResolver(checkboxSchema),
    defaultValues: { interesses: [] as string[], termos: false }
  });
  const { errors } = formState;

  return (
    <Panel title="Caixas de seleção" subtitle="Mínimo de itens e aceite obrigatório">
      <Stack component="form" noValidate spacing={2} onSubmit={handleSubmit(() => fakeSend('Preferências registradas.'))}>
        <FormControl error={!!errors.interesses} component="fieldset">
          <FormLabel component="legend">Interesses</FormLabel>
          <Controller
            name="interesses"
            control={control}
            render={({ field }) => (
              <FormGroup row>
                {INTERESSES.map((i) => (
                  <FormControlLabel
                    key={i}
                    label={i}
                    control={
                      <Checkbox
                        checked={field.value.includes(i)}
                        onChange={(e) => field.onChange(e.target.checked ? [...field.value, i] : field.value.filter((x) => x !== i))}
                      />
                    }
                  />
                ))}
              </FormGroup>
            )}
          />
          {errors.interesses && <FormHelperText>{errors.interesses.message}</FormHelperText>}
        </FormControl>
        <FormControl error={!!errors.termos}>
          <Controller
            name="termos"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={<Checkbox checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                label="Li e aceito os termos de uso"
              />
            )}
          />
          {errors.termos && <FormHelperText>{errors.termos.message}</FormHelperText>}
        </FormControl>
        <FormActions loading={formState.isSubmitting} onReset={() => reset()} />
      </Stack>
    </Panel>
  );
}

// ---------- autocomplete ----------

const autoSchema = z.object({
  cidade: z.custom<Cidade | null>().refine((v) => v !== null, 'Escolha a cidade na lista.'),
  tecnologias: z.array(z.string()).min(2, 'Escolha pelo menos duas tecnologias.').max(5, 'No máximo cinco tecnologias.')
});

export function AutocompleteForm() {
  const { control, handleSubmit, reset, formState } = useForm({
    resolver: zodResolver(autoSchema),
    defaultValues: { cidade: null as Cidade | null, tecnologias: [] as string[] }
  });

  return (
    <Panel title="Autocompletar" subtitle="Busca em listas, com uma ou várias escolhas">
      <Stack
        component="form"
        noValidate
        spacing={2.5}
        onSubmit={handleSubmit((v) => fakeSend(`${v.tecnologias.length} tecnologias em ${v.cidade?.nome ?? ''}.`))}
      >
        <Controller
          name="cidade"
          control={control}
          render={({ field, fieldState }) => (
            <Autocomplete
              options={CIDADES}
              value={field.value}
              onChange={(_, v) => field.onChange(v)}
              getOptionLabel={(c) => `${c.nome} - ${c.uf}`}
              isOptionEqualToValue={(a, b) => a.nome === b.nome && a.uf === b.uf}
              groupBy={(c) => c.uf}
              noOptionsText="Nenhuma cidade encontrada"
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Cidade"
                  onBlur={field.onBlur}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          )}
        />
        <Controller
          name="tecnologias"
          control={control}
          render={({ field, fieldState }) => (
            <Autocomplete
              multiple
              options={TECNOLOGIAS}
              value={field.value}
              onChange={(_, v) => field.onChange(v)}
              filterSelectedOptions
              noOptionsText="Nada encontrado"
              renderValue={(value, getItemProps) =>
                value.map((option, index) => {
                  const { key, ...itemProps } = getItemProps({ index });
                  return <Chip key={key} size="small" label={option} {...itemProps} />;
                })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Tecnologias"
                  placeholder={field.value.length ? '' : 'Digite para buscar'}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message ?? 'De duas a cinco.'}
                />
              )}
            />
          )}
        />
        <FormActions loading={formState.isSubmitting} onReset={() => reset()} />
      </Stack>
    </Panel>
  );
}
