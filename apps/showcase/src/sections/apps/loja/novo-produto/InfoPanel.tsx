// Painel de informações do produto.
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import { Controller, useFormContext } from 'react-hook-form';
import { Panel } from '@c3theme/ui';
import { CATEGORIES } from '../data';
import type { FormValues } from './schema';

/** Nome, SKU, marca, categoria, tamanhos e textos. */
export function InfoPanel({ title }: { title: string }) {
  const {
    control,
    register,
    formState: { errors }
  } = useFormContext<FormValues>();
  return (
    <>
      <Panel title={title}>
        <Grid container spacing={2.5}>
          <Grid size={12}>
            <TextField label="Nome" fullWidth {...register('nome')} error={!!errors.nome} helperText={errors.nome?.message} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="SKU"
              fullWidth
              {...register('sku', { setValueAs: (v: string) => v.toUpperCase() })}
              error={!!errors.sku}
              helperText={errors.sku?.message ?? 'Código interno, ex.: C3-01234'}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Marca" fullWidth {...register('marca')} error={!!errors.marca} helperText={errors.marca?.message} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              control={control}
              name="categoria"
              render={({ field }) => (
                <TextField
                  select
                  label="Categoria"
                  fullWidth
                  {...field}
                  value={field.value ?? ''}
                  error={!!errors.categoria}
                  helperText={errors.categoria?.message}
                >
                  {Object.entries(CATEGORIES).map(([k, v]) => (
                    <MenuItem key={k} value={k}>
                      {v}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              control={control}
              name="tamanhos"
              render={({ field }) => (
                <Autocomplete
                  multiple
                  freeSolo
                  options={['P', 'M', 'G', 'GG', '38', '40', '42', 'Único']}
                  value={field.value ?? []}
                  onChange={(_, v) => field.onChange(v)}
                  renderInput={(params) => (
                    <TextField {...params} label="Tamanhos" helperText="Opcional. Digite e tecle Enter para criar." />
                  )}
                />
              )}
            />
          </Grid>
          <Grid size={12}>
            <TextField
              label="Resumo"
              fullWidth
              {...register('resumo')}
              error={!!errors.resumo}
              helperText={errors.resumo?.message ?? 'Aparece logo abaixo do preço.'}
            />
          </Grid>
          <Grid size={12}>
            <TextField
              label="Descrição"
              fullWidth
              multiline
              minRows={4}
              {...register('descricao')}
              error={!!errors.descricao}
              helperText={errors.descricao?.message}
            />
          </Grid>
        </Grid>
      </Panel>
    </>
  );
}
