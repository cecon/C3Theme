// Login.
import { useState } from 'react';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Panel } from '@c3theme/ui';
import { FormActions, PasswordInput, fakeSend } from './shared';

// ---------- login ----------

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Informe o e-mail.').pipe(z.email('E-mail inválido.')),
  senha: z.string().min(1, 'Informe a senha.').min(8, 'A senha tem no mínimo 8 caracteres.')
});

export function LoginForm() {
  const [show, setShow] = useState(false);
  const { register, handleSubmit, reset, formState } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', senha: '' }
  });
  const { errors, isSubmitting } = formState;

  return (
    <Panel title="Login" subtitle="Validação ao enviar">
      <Stack component="form" noValidate spacing={2.5} onSubmit={handleSubmit(() => fakeSend('Login validado.'))}>
        <TextField label="E-mail" type="email" {...register('email')} error={!!errors.email} helperText={errors.email?.message} fullWidth />
        <TextField
          label="Senha"
          type={show ? 'text' : 'password'}
          autoComplete="current-password"
          {...register('senha')}
          error={!!errors.senha}
          helperText={errors.senha?.message}
          fullWidth
          slotProps={{ input: { endAdornment: <PasswordInput show={show} onToggle={() => setShow((s) => !s)} /> } }}
        />
        <FormActions loading={isSubmitting} onReset={() => reset()} />
      </Stack>
    </Panel>
  );
}
