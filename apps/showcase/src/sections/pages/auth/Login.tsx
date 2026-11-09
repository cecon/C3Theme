// Tela de entrada.
import { Link as RouterLink, useNavigate } from 'react-router';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { notify } from '@c3theme/ui';
import { PasswordInput, ScreenTitle, SocialButtons, useAuthLinks, wait } from './fields';
import { email } from './schemas';

const loginSchema = z.object({ email, password: z.string().min(6, 'A senha tem pelo menos 6 caracteres.'), remember: z.boolean() });
type LoginValues = z.infer<typeof loginSchema>;

export function Login() {
  const { to } = useAuthLinks();
  const navigate = useNavigate();
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: 'ana@c3theme.dev', password: 'C3demo#2026', remember: true }
  });

  const onSubmit = async (v: LoginValues) => {
    await wait();
    notify(`Bem-vinda de volta! (login simulado: ${v.email})`);
    navigate('/dashboard/padrao');
  };

  return (
    <>
      <ScreenTitle
        title="Entrar"
        subtitle={
          <>
            Não tem conta?{' '}
            <Link component={RouterLink} to={to('cadastro')}>
              Crie agora
            </Link>
          </>
        }
      />
      <Alert severity="info" sx={{ mb: 3 }}>
        Simulação: qualquer e-mail válido e senha com 6 ou mais caracteres entram.
      </Alert>
      <Stack component="form" spacing={2.5} onSubmit={handleSubmit(onSubmit)} noValidate>
        <TextField
          label="E-mail"
          type="email"
          autoComplete="email"
          fullWidth
          {...register('email')}
          error={!!errors.email}
          helperText={errors.email?.message}
        />
        <PasswordInput
          label="Senha"
          autoComplete="current-password"
          {...register('password')}
          error={!!errors.password}
          helperText={errors.password?.message}
        />
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <Controller
            control={control}
            name="remember"
            render={({ field }) => (
              <FormControlLabel
                control={<Checkbox checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                label="Manter conectado"
              />
            )}
          />
          <Link component={RouterLink} to={to('esqueci-senha')} variant="body2">
            Esqueci a senha
          </Link>
        </Stack>
        <Button type="submit" variant="contained" size="large" fullWidth loading={isSubmitting}>
          Entrar
        </Button>
      </Stack>
      <SocialButtons action="Entrar" />
    </>
  );
}

// ---------------------------------------------------------------- cadastro
