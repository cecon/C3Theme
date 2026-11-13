import { FormEvent, useEffect, useState } from 'react';
import { Link as RouterLink, Navigate, useLocation, useNavigate } from 'react-router';

// material-ui
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { notify, OtpInput } from '@c3theme/ui';
import { useAuth } from '../session';
import { codigoCompleto, ESPERA_PARA_REENVIAR, mensagemDoCodigo, pedeNovoCodigo, textoDaEspera } from '../codigo';
import { AuthHeading } from './shared';

/**
 * Conferência do código no modo de entrada `codigo` (#123). O código que expirou ou esgotou as tentativas pede
 * reenvio; a espera de reenvio conta em segundos e o Enter no campo confere o código. Sem senha em lugar nenhum.
 */
export default function CodeLoginVerifyPage() {
  const { loginWithCode, requestCode } = useAuth();
  const state = useLocation().state as { email?: string; from?: string } | null;
  const email = state?.email;
  const from = state?.from ?? '/';
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [wait, setWait] = useState(ESPERA_PARA_REENVIAR);

  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((segundos) => segundos - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  if (!email) return <Navigate to="/login" replace />;

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    if (!codigoCompleto(code)) {
      setError('Digite os 6 dígitos do código.');
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      await loginWithCode(email!, code);
      navigate(from, { replace: true });
    } catch (err) {
      setError(mensagemDoCodigo(err));
      if (pedeNovoCodigo(err)) setWait(0);
      setLoading(false);
    }
  }

  async function resend() {
    setResending(true);
    setError(undefined);
    try {
      await requestCode(email!);
      setWait(ESPERA_PARA_REENVIAR);
      setCode('');
      notify('Enviamos um novo código.', 'info');
    } catch (err) {
      setError(mensagemDoCodigo(err));
    } finally {
      setResending(false);
    }
  }

  return (
    <Stack component="form" spacing={2.5} onSubmit={submit} noValidate>
      <AuthHeading title="Confira seu e-mail" subtitle={`Digite o código de 6 dígitos enviado para ${email}.`} />
      {error && <Alert severity="error">{error}</Alert>}
      <OtpInput value={code} onChange={setCode} error={!!error} autoFocus />
      <Button type="submit" variant="contained" size="large" loading={loading}>
        Entrar
      </Button>
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
        Não recebeu?{' '}
        {wait > 0 ? (
          textoDaEspera(wait)
        ) : (
          <Link component="button" type="button" onClick={resend} disabled={resending} sx={{ verticalAlign: 'baseline' }}>
            {resending ? 'Enviando…' : 'Reenviar código'}
          </Link>
        )}
      </Typography>
      <Link component={RouterLink} to="/login" variant="body2" sx={{ textAlign: 'center' }}>
        Usar outro e-mail
      </Link>
    </Stack>
  );
}
