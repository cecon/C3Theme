import { FormEvent, useEffect, useState } from 'react';
import { Link as RouterLink, Navigate, useLocation, useNavigate } from 'react-router';

// material-ui
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { notify, OtpInput } from '@c3theme/ui';
import { authService } from '../../auth';
import { AuthHeading, errorMessage } from './shared';

const RESEND_SECONDS = 30;

export default function CodeVerificationPage() {
  const email = (useLocation().state as { email?: string } | null)?.email;
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [wait, setWait] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  if (!email) return <Navigate to="/forgot-password" replace />;

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    if (code.length < 6) {
      setError('Digite os 6 dígitos do código.');
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      await authService.verifyCode(email!, code);
      navigate('/reset-password', { state: { email, code }, replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    await authService.forgotPassword(email!);
    setWait(RESEND_SECONDS);
    notify('Enviamos um novo código.', 'info');
  }

  return (
    <Stack component="form" spacing={2.5} onSubmit={submit} noValidate>
      <AuthHeading title="Código de verificação" subtitle={`Digite o código de 6 dígitos enviado para ${email}.`} />
      {error && <Alert severity="error">{error}</Alert>}
      <OtpInput value={code} onChange={setCode} error={!!error} autoFocus />
      <Button type="submit" variant="contained" size="large" loading={loading}>
        Continuar
      </Button>
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
        Não recebeu?{' '}
        {wait > 0 ? (
          `Reenviar em ${wait}s`
        ) : (
          <Link component="button" type="button" onClick={resend} sx={{ verticalAlign: 'baseline' }}>
            Reenviar código
          </Link>
        )}
      </Typography>
      <Link component={RouterLink} to="/login" variant="body2" sx={{ textAlign: 'center' }}>
        Voltar ao login
      </Link>
    </Stack>
  );
}
