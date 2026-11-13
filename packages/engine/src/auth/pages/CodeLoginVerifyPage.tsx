import { FormEvent, useRef, useState } from 'react';
import { Link as RouterLink, Navigate, useLocation, useNavigate } from 'react-router';

// material-ui
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { notify, OtpInput } from '@c3theme/ui';
import { useAuth } from '../session';
import { codigoCompleto, codigoDoErro, ESPERA_PARA_REENVIAR, mensagemDoCodigo, pedeNovoCodigo, textoDaEspera } from '../codigo';
import { AuthHeading } from './shared';
import useCodeWait from '../useCodeWait';

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
  const [wait, setWait] = useCodeWait(ESPERA_PARA_REENVIAR);
  const [generation, setGeneration] = useState(0);
  const busy = useRef(false);

  if (!email) return <Navigate to="/login" replace />;

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    if (busy.current) return;
    if (!codigoCompleto(code)) {
      setError('Digite os 6 dígitos do código.');
      return;
    }
    busy.current = true;
    setLoading(true);
    setError(undefined);
    try {
      await loginWithCode(email!, code);
      navigate(from, { replace: true });
    } catch (err) {
      setError(mensagemDoCodigo(err));
      if (pedeNovoCodigo(err)) setWait(codigoDoErro(err) === 'muitas-tentativas' ? ESPERA_PARA_REENVIAR : 0);
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }

  async function resend() {
    if (busy.current || wait > 0) return;
    busy.current = true;
    setResending(true);
    setError(undefined);
    try {
      await requestCode(email!);
      setWait(ESPERA_PARA_REENVIAR);
      setCode('');
      setGeneration((current) => current + 1);
      notify('Enviamos um novo código.', 'info');
    } catch (err) {
      setError(mensagemDoCodigo(err));
    } finally {
      busy.current = false;
      setResending(false);
    }
  }

  return (
    <Stack component="form" spacing={2.5} onSubmit={submit} noValidate>
      <AuthHeading title="Confira seu e-mail" subtitle={`Digite o código de 6 dígitos enviado para ${email}.`} />
      {error && <Alert severity="error">{error}</Alert>}
      <OtpInput
        key={generation}
        value={code}
        onChange={(next) => {
          if (!busy.current) setCode(next);
        }}
        error={!!error}
        autoFocus
      />
      <Button type="submit" variant="contained" size="large" loading={loading} disabled={resending}>
        Entrar
      </Button>
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
        Não recebeu?{' '}
        {wait > 0 ? (
          textoDaEspera(wait)
        ) : (
          <Link component="button" type="button" onClick={resend} disabled={resending || loading} sx={{ verticalAlign: 'baseline' }}>
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
