// Troca de senha com regras visíveis.
import { useState } from 'react';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import TextField, { TextFieldProps } from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { zodResolver } from '@hookform/resolvers/zod';
import { CloseCircle, Eye, EyeSlash, TickCircle } from 'iconsax-reactjs';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { notify, passwordScore, PasswordStrength } from '@c3theme/ui';
import { wait } from './PersonalForm';

// ---------------------------------------------------------------- senha

const passwordSchema = z
  .object({
    current: z.string().min(1, 'Informe a senha atual.'),
    next: z
      .string()
      .min(8, 'Use pelo menos 8 caracteres.')
      .refine((v) => passwordScore(v) >= 2, 'Senha fraca: misture maiúsculas, números e símbolos.'),
    confirm: z.string()
  })
  .refine((v) => v.next === v.confirm, { path: ['confirm'], message: 'As senhas não conferem.' })
  .refine((v) => v.next !== v.current, { path: ['next'], message: 'A nova senha deve ser diferente da atual.' });

type PasswordValues = z.infer<typeof passwordSchema>;

/** Campo de senha com botão de mostrar/ocultar. */
export function PasswordField(props: TextFieldProps) {
  const [show, setShow] = useState(false);
  return (
    <TextField
      fullWidth
      {...props}
      type={show ? 'text' : 'password'}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton aria-label={show ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setShow((s) => !s)} edge="end">
                {show ? <EyeSlash size={18} /> : <Eye size={18} />}
              </IconButton>
            </InputAdornment>
          )
        }
      }}
    />
  );
}

const RULES: { label: string; test: (p: string) => boolean }[] = [
  { label: 'Pelo menos 8 caracteres', test: (p) => p.length >= 8 },
  { label: 'Uma letra minúscula e uma maiúscula', test: (p) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { label: 'Pelo menos um número', test: (p) => /\d/.test(p) },
  { label: 'Pelo menos um símbolo (!@#$...)', test: (p) => /[^a-zA-Z0-9]/.test(p) }
];

export function PasswordForm() {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema), defaultValues: { current: '', next: '', confirm: '' } });
  const next = watch('next');

  const onSubmit = async () => {
    await wait(600);
    reset();
    notify('Senha alterada. Use a nova senha no próximo acesso.');
  };

  return (
    <Grid container spacing={4} component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Grid size={{ xs: 12, md: 6 }}>
        <Stack spacing={2.5}>
          <PasswordField
            label="Senha atual"
            autoComplete="current-password"
            {...register('current')}
            error={!!errors.current}
            helperText={errors.current?.message}
          />
          <Stack spacing={1}>
            <PasswordField
              label="Nova senha"
              autoComplete="new-password"
              {...register('next')}
              error={!!errors.next}
              helperText={errors.next?.message}
            />
            <PasswordStrength password={next} />
          </Stack>
          <PasswordField
            label="Confirme a nova senha"
            autoComplete="new-password"
            {...register('confirm')}
            error={!!errors.confirm}
            helperText={errors.confirm?.message}
          />
        </Stack>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Typography variant="subtitle1">A nova senha precisa ter</Typography>
        <List dense>
          {RULES.map((r) => {
            const ok = r.test(next);
            return (
              <ListItem key={r.label} disableGutters>
                <ListItemIcon sx={{ minWidth: 32, color: ok ? 'success.main' : 'text.disabled' }}>
                  {ok ? <TickCircle size={18} variant="Bold" /> : <CloseCircle size={18} />}
                </ListItemIcon>
                <ListItemText primary={r.label} slotProps={{ primary: { color: ok ? 'text.primary' : 'text.secondary' } }} />
              </ListItem>
            );
          })}
        </List>
      </Grid>
      <Grid size={12}>
        <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
          <Button color="inherit" onClick={() => reset()}>
            Limpar
          </Button>
          <Button type="submit" variant="contained" loading={isSubmitting}>
            Alterar senha
          </Button>
        </Stack>
      </Grid>
    </Grid>
  );
}
