// Esqueci a senha e aviso de e-mail enviado.
import { Link as RouterLink, useNavigate } from 'react-router';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, SmsTracking } from 'iconsax-reactjs';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { notify, SoftAvatar } from '@c3theme/ui';
import { ScreenTitle, useAuthLinks, wait } from './fields';
import { email, useEmailFromState } from './schemas';

const forgotSchema = z.object({ email });

export function ForgotPassword() {
  const { to } = useAuthLinks();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<{ email: string }>({ resolver: zodResolver(forgotSchema), defaultValues: { email: '' } });

  const onSubmit = async (v: { email: string }) => {
    await wait();
    notify('Se houver uma conta com esse e-mail, as instruções chegam em instantes.', 'info');
    navigate(to('confira-email'), { state: { email: v.email } });
  };

  return (
    <>
      <ScreenTitle title="Esqueceu a senha?" subtitle="Informe o e-mail da conta e enviaremos um link para criar uma nova senha." />
      <Stack component="form" spacing={2.5} onSubmit={handleSubmit(onSubmit)} noValidate>
        <TextField
          label="E-mail"
          type="email"
          autoComplete="email"
          autoFocus
          fullWidth
          {...register('email')}
          error={!!errors.email}
          helperText={errors.email?.message}
        />
        <Button type="submit" variant="contained" size="large" fullWidth loading={isSubmitting}>
          Enviar link
        </Button>
        <Button component={RouterLink} to={to('login')} startIcon={<ArrowLeft size={18} />} color="inherit">
          Voltar para o login
        </Button>
      </Stack>
    </>
  );
}

// ---------------------------------------------------------------- confira o e-mail

export function CheckMail() {
  const { to } = useAuthLinks();
  const sentTo = useEmailFromState();
  return (
    <Stack sx={{ alignItems: 'center', textAlign: 'center' }}>
      <SoftAvatar size="xl" tone="primary" sx={{ mb: 2.5 }}>
        <SmsTracking size={32} variant="Bulk" />
      </SoftAvatar>
      <ScreenTitle
        title="Confira seu e-mail"
        subtitle={
          <>
            Enviamos um link para {sentTo ? <strong>{sentTo}</strong> : 'o seu e-mail'}. Ele vale por 30 minutos. Não achou? Olhe também a
            caixa de spam.
          </>
        }
      />
      <Stack spacing={1.5} sx={{ width: '100%' }}>
        <Button component={RouterLink} to={to('nova-senha')} variant="contained" size="large" fullWidth>
          Abrir o link (simulação)
        </Button>
        <Button fullWidth onClick={() => notify(sentTo ? `Reenviamos o link para ${sentTo}.` : 'Link reenviado.', 'info')}>
          Reenviar e-mail
        </Button>
        <Button component={RouterLink} to={to('login')} color="inherit" startIcon={<ArrowLeft size={18} />}>
          Voltar para o login
        </Button>
      </Stack>
    </Stack>
  );
}

// ---------------------------------------------------------------- código de verificação
