// Tela de cadastro.
import { Link as RouterLink, useNavigate } from 'react-router';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { notify, PasswordStrength } from '@c3theme/ui';
import { PasswordInput, ScreenTitle, SocialButtons, useAuthLinks, wait } from './fields';
import { email, strongPassword } from './schemas';

const registerSchema = z.object({
  firstName: z.string().trim().min(1, 'Informe o nome.'),
  lastName: z.string().trim().min(1, 'Informe o sobrenome.'),
  company: z.string().trim(),
  email,
  password: strongPassword,
  terms: z.literal(true, { error: 'Aceite os termos para continuar.' })
});
type RegisterInput = z.input<typeof registerSchema>;
type RegisterValues = z.output<typeof registerSchema>;

export function Register() {
  const { to } = useAuthLinks();
  const navigate = useNavigate();
  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<RegisterInput, unknown, RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: '', lastName: '', company: '', email: '', password: '' },
    mode: 'onTouched'
  });
  const password = watch('password');

  const onSubmit = async (v: RegisterValues) => {
    await wait();
    notify(`Conta criada. Enviamos um código para ${v.email}.`);
    navigate(to('codigo-verificacao'), { state: { email: v.email } });
  };

  return (
    <>
      <ScreenTitle
        title="Criar conta"
        subtitle={
          <>
            Já tem conta?{' '}
            <Link component={RouterLink} to={to('login')}>
              Entrar
            </Link>
          </>
        }
      />
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Nome"
              required
              autoComplete="given-name"
              fullWidth
              {...register('firstName')}
              error={!!errors.firstName}
              helperText={errors.firstName?.message}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Sobrenome"
              required
              autoComplete="family-name"
              fullWidth
              {...register('lastName')}
              error={!!errors.lastName}
              helperText={errors.lastName?.message}
            />
          </Grid>
          <Grid size={12}>
            <TextField label="Empresa (opcional)" autoComplete="organization" fullWidth {...register('company')} />
          </Grid>
          <Grid size={12}>
            <TextField
              label="E-mail"
              type="email"
              required
              autoComplete="email"
              fullWidth
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
            />
          </Grid>
          <Grid size={12}>
            <Stack spacing={1}>
              <PasswordInput
                label="Senha"
                required
                autoComplete="new-password"
                {...register('password')}
                error={!!errors.password}
                helperText={errors.password?.message}
              />
              <PasswordStrength password={password} />
            </Stack>
          </Grid>
          <Grid size={12}>
            <Controller
              control={control}
              name="terms"
              render={({ field, fieldState }) => (
                <>
                  <FormControlLabel
                    control={<Checkbox checked={!!field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                    label={<Typography variant="body2">Li e aceito os termos de uso e a política de privacidade.</Typography>}
                  />
                  {fieldState.error && <FormHelperText error>{fieldState.error.message}</FormHelperText>}
                </>
              )}
            />
          </Grid>
          <Grid size={12}>
            <Button type="submit" variant="contained" size="large" fullWidth loading={isSubmitting}>
              Criar conta
            </Button>
          </Grid>
        </Grid>
      </Box>
      <SocialButtons action="Cadastrar" />
    </>
  );
}

// ---------------------------------------------------------------- esqueci a senha
