// Cadastro de endereço de entrega.
import { useEffect } from 'react';
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
import { PatternFormat } from 'react-number-format';
import { z } from 'zod';
import { notify } from '@c3theme/ui';
import { UFS } from '../../clientes/data';
import { Address } from '../data';
import { useStore } from '../store';

const schema = z.object({
  apelido: z.string().trim().min(2, 'Ex.: Casa, Trabalho.'),
  destinatario: z.string().trim().min(3, 'Informe quem vai receber.'),
  telefone: z.string().regex(/^\d{10,11}$/, 'Telefone incompleto.'),
  cep: z.string().regex(/^\d{8}$/, 'CEP incompleto.'),
  rua: z.string().trim().min(3, 'Informe a rua.'),
  numero: z.string().trim().min(1, 'Informe o número.'),
  complemento: z.string().trim().optional(),
  bairro: z.string().trim().min(2, 'Informe o bairro.'),
  cidade: z.string().trim().min(2, 'Informe a cidade.'),
  uf: z.string().length(2, 'Escolha o estado.')
});
type FormValues = z.infer<typeof schema>;

const EMPTY: FormValues = {
  apelido: '',
  destinatario: '',
  telefone: '',
  cep: '',
  rua: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: ''
};

export function AddressDialog({
  open,
  address,
  onClose,
  onSaved
}: {
  open: boolean;
  address?: Address;
  onClose: () => void;
  onSaved: (a: Address) => void;
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { addresses, saveAddress } = useStore();
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: EMPTY });

  useEffect(() => {
    if (open) reset(address ? { ...EMPTY, ...address } : EMPTY);
  }, [open, address, reset]);

  function submit(v: FormValues) {
    const saved: Address = { ...v, id: address?.id ?? addresses.reduce((m, a) => Math.max(m, a.id), 0) + 1 };
    saveAddress(saved);
    notify(address ? 'Endereço atualizado.' : 'Endereço cadastrado.');
    onSaved(saved);
    onClose();
  }

  const masked = (name: 'telefone' | 'cep', label: string, format: string) => (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <PatternFormat
          customInput={TextField}
          format={format}
          mask="_"
          label={label}
          fullWidth
          value={field.value}
          onValueChange={(v) => field.onChange(v.value)}
          onBlur={field.onBlur}
          inputRef={field.ref}
          error={!!errors[name]}
          helperText={errors[name]?.message}
        />
      )}
    />
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={fullScreen} aria-labelledby="endereco-titulo">
      <Box component="form" onSubmit={handleSubmit(submit)} noValidate sx={{ display: 'contents' }}>
        <DialogTitle id="endereco-titulo">{address ? 'Editar endereço' : 'Novo endereço'}</DialogTitle>
        <Divider />
        <DialogContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField label="Apelido" fullWidth {...register('apelido')} error={!!errors.apelido} helperText={errors.apelido?.message} />
            </Grid>
            <Grid size={{ xs: 12, sm: 8 }}>
              <TextField
                label="Destinatário"
                fullWidth
                {...register('destinatario')}
                error={!!errors.destinatario}
                helperText={errors.destinatario?.message}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>{masked('telefone', 'Telefone', '(##) #####-####')}</Grid>
            <Grid size={{ xs: 12, sm: 6 }}>{masked('cep', 'CEP', '#####-###')}</Grid>
            <Grid size={{ xs: 12, sm: 9 }}>
              <TextField label="Rua" fullWidth {...register('rua')} error={!!errors.rua} helperText={errors.rua?.message} />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField label="Número" fullWidth {...register('numero')} error={!!errors.numero} helperText={errors.numero?.message} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Complemento" fullWidth {...register('complemento')} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Bairro" fullWidth {...register('bairro')} error={!!errors.bairro} helperText={errors.bairro?.message} />
            </Grid>
            <Grid size={{ xs: 8, sm: 9 }}>
              <TextField label="Cidade" fullWidth {...register('cidade')} error={!!errors.cidade} helperText={errors.cidade?.message} />
            </Grid>
            <Grid size={{ xs: 4, sm: 3 }}>
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
          </Grid>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button color="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained">
            Salvar endereço
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
