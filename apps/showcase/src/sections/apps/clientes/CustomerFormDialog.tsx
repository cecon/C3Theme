import { useEffect } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { NumericFormat, PatternFormat } from 'react-number-format';
import { notify } from '@c3theme/ui';
import { Customer, INTERESSES, STATUS, UFS } from './data';
import { useCustomers } from './store';
import { EMPTY, schema } from './customerForm';
import type { FormValues } from './customerForm';
import { AvatarPicker } from './AvatarPicker';

interface Props {
  open: boolean;
  /** Cliente em edição; sem ele o diálogo cadastra um novo. */
  customer?: Customer;
  onClose: () => void;
}

export default function CustomerFormDialog({ open, customer, onClose }: Props) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { save, nextId } = useCustomers();
  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: EMPTY });

  useEffect(() => {
    if (open) reset(customer ? { ...customer } : EMPTY);
  }, [open, customer, reset]);

  const nome = watch('nome') ?? '';

  function submit(values: FormValues) {
    const base = customer ?? { id: nextId(), desde: new Date().toISOString(), pedidos: 0, totalGasto: 0 };
    save({ ...base, ...values });
    notify(customer ? 'Cliente atualizado.' : 'Cliente cadastrado.');
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth fullScreen={fullScreen} aria-labelledby="cliente-form-titulo">
      <Box component="form" onSubmit={handleSubmit(submit)} noValidate sx={{ display: 'contents' }}>
        <DialogTitle id="cliente-form-titulo">{customer ? 'Editar cliente' : 'Novo cliente'}</DialogTitle>
        <Divider />
        <DialogContent>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 3 }}>
              <Controller
                control={control}
                name="foto"
                render={({ field }) => <AvatarPicker value={field.value} name={nome} onChange={field.onChange} />}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 9 }}>
              <Grid container spacing={2}>
                <Grid size={12}>
                  <TextField
                    label="Nome completo"
                    fullWidth
                    {...register('nome')}
                    error={!!errors.nome}
                    helperText={errors.nome?.message}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="E-mail"
                    type="email"
                    fullWidth
                    {...register('email')}
                    error={!!errors.email}
                    helperText={errors.email?.message}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    control={control}
                    name="telefone"
                    render={({ field }) => (
                      <PatternFormat
                        customInput={TextField}
                        format="(##) #####-####"
                        mask="_"
                        label="Telefone"
                        fullWidth
                        value={field.value}
                        onValueChange={(v) => field.onChange(v.value)}
                        onBlur={field.onBlur}
                        inputRef={field.ref}
                        error={!!errors.telefone}
                        helperText={errors.telefone?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    control={control}
                    name="cpf"
                    render={({ field }) => (
                      <PatternFormat
                        customInput={TextField}
                        format="###.###.###-##"
                        mask="_"
                        label="CPF"
                        fullWidth
                        value={field.value}
                        onValueChange={(v) => field.onChange(v.value)}
                        onBlur={field.onBlur}
                        inputRef={field.ref}
                        error={!!errors.cpf}
                        helperText={errors.cpf?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    control={control}
                    name="idade"
                    render={({ field }) => (
                      <NumericFormat
                        customInput={TextField}
                        label="Idade"
                        allowNegative={false}
                        decimalScale={0}
                        fullWidth
                        value={field.value ?? ''}
                        onValueChange={(v) => field.onChange(v.floatValue)}
                        onBlur={field.onBlur}
                        inputRef={field.ref}
                        error={!!errors.idade}
                        helperText={errors.idade?.message}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Profissão" fullWidth {...register('cargo')} error={!!errors.cargo} helperText={errors.cargo?.message} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <TextField select label="Situação" fullWidth {...field}>
                    {Object.entries(STATUS).map(([value, s]) => (
                      <MenuItem key={value} value={value}>
                        {s.label}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            <Grid size={{ xs: 8, sm: 8 }}>
              <TextField label="Cidade" fullWidth {...register('cidade')} error={!!errors.cidade} helperText={errors.cidade?.message} />
            </Grid>
            <Grid size={{ xs: 4, sm: 4 }}>
              <Controller
                control={control}
                name="uf"
                render={({ field }) => (
                  <TextField select label="UF" fullWidth {...field} error={!!errors.uf} helperText={errors.uf?.message}>
                    {UFS.map((uf) => (
                      <MenuItem key={uf} value={uf}>
                        {uf}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            <Grid size={12}>
              <Controller
                control={control}
                name="interesses"
                render={({ field }) => (
                  <Autocomplete
                    multiple
                    options={INTERESSES}
                    value={field.value ?? []}
                    onChange={(_, v) => field.onChange(v)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Interesses"
                        error={!!errors.interesses}
                        helperText={errors.interesses?.message ?? 'Usados para segmentar campanhas.'}
                      />
                    )}
                  />
                )}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                label="Observações"
                fullWidth
                multiline
                minRows={3}
                {...register('sobre')}
                error={!!errors.sobre}
                helperText={errors.sobre?.message}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button color="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" loading={isSubmitting}>
            {customer ? 'Salvar alterações' : 'Cadastrar'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
