// Código de verificação e nova senha.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormHelperText from '@mui/material/FormHelperText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { notify, OtpInput, PasswordStrength } from '@c3theme/ui';
import { PasswordInput, ScreenTitle, useAuthLinks, wait } from './fields';
import { strongPassword, useEmailFromState } from './schemas';

const RESEND_SECONDS = 30;

export function CodeVerification() {
  const { to } = useAuthLinks();
  const navigate = useNavigate();
  const sentTo = useEmailFromState() ?? 'ana@c3theme.dev';
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const verify = async () => {
    if (code.length < 6) return setError('Digite os 6 dígitos.');
    setLoading(true);
    await wait();
    setLoading(false);
    // na simulação, 000000 é o "código errado" para mostrar o erro
    if (code === '000000') return setError('Código incorreto. Confira e tente de novo.');
    notify('E-mail confirmado! Agora é só entrar.');
    navigate(to('login'));
  };

  const masked = sentTo.replace(/^(.{2}).*(@.*)$/, '$1•••$2');

  return (
    <>
      <ScreenTitle title="Código de verificação" subtitle={`Digite o código de 6 dígitos que enviamos para ${masked}.`} />
      <Box
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
          verify();
        }}
        noValidate
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', '& .MuiInputBase-root': { width: { xs: 42, sm: 48 } } }}>
          <OtpInput
            value={code}
            onChange={(v) => {
              setCode(v);
              setError(undefined);
            }}
            error={!!error}
            autoFocus
          />
        </Box>
        {error && (
          <FormHelperText error sx={{ textAlign: 'center', mt: 1 }}>
            {error}
          </FormHelperText>
        )}
        <Typography variant="caption" color="text.secondary" component="p" sx={{ textAlign: 'center', mt: 1.5 }}>
          Dica da simulação: qualquer código entra, menos 000000.
        </Typography>
        <Button type="submit" variant="contained" size="large" fullWidth loading={loading} sx={{ mt: 3 }}>
          Confirmar
        </Button>
      </Box>
      <Stack direction="row" sx={{ justifyContent: 'center', alignItems: 'center', mt: 2, gap: 0.5, flexWrap: 'wrap' }}>
        <Typography variant="body2" color="text.secondary">
          Não recebeu?
        </Typography>
        <Button
          size="small"
          disabled={seconds > 0}
          onClick={() => {
            setSeconds(RESEND_SECONDS);
            notify(`Novo código enviado para ${masked}.`, 'info');
          }}
        >
          {seconds > 0 ? `Reenviar em ${seconds}s` : 'Reenviar código'}
        </Button>
      </Stack>
    </>
  );
}

// ---------------------------------------------------------------- nova senha

const resetSchema = z
  .object({ password: strongPassword, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'As senhas não conferem.' });
type ResetValues = z.infer<typeof resetSchema>;

export function ResetPassword() {
  const { to } = useAuthLinks();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<ResetValues>({ resolver: zodResolver(resetSchema), defaultValues: { password: '', confirm: '' }, mode: 'onTouched' });
  const password = watch('password');

  const onSubmit = async () => {
    await wait();
    notify('Senha redefinida. Entre com a nova senha.');
    navigate(to('login'));
  };

  return (
    <>
      <ScreenTitle title="Criar nova senha" subtitle="Escolha uma senha que você não usa em outros sites." />
      <Stack component="form" spacing={2.5} onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={1}>
          <PasswordInput
            label="Nova senha"
            autoComplete="new-password"
            autoFocus
            {...register('password')}
            error={!!errors.password}
            helperText={errors.password?.message}
          />
          <PasswordStrength password={password} />
        </Stack>
        <PasswordInput
          label="Confirme a senha"
          autoComplete="new-password"
          {...register('confirm')}
          error={!!errors.confirm}
          helperText={errors.confirm?.message}
        />
        <Button type="submit" variant="contained" size="large" fullWidth loading={isSubmitting}>
          Salvar nova senha
        </Button>
      </Stack>
    </>
  );
}
