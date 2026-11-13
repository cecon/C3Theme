import { FormEvent, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

// material-ui
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';

import { useText } from '../../context';
import { useAuth } from '../session';
import { codigoDoErro, ESPERA_PARA_REENVIAR, mensagemDoCodigo } from '../codigo';
import { AuthHeading, identifierField } from './shared';
import useCodeWait from '../useCodeWait';

/**
 * Entrada no modo `codigo` (#123): só o e-mail e a ação de enviar o código. Sem campo de senha e sem link de
 * "Esqueci a senha" — o código é o único caminho. Enter no campo envia.
 */
export default function CodeLoginPage() {
  const { requestCode, config } = useAuth();
  const text = useText();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/';
  const id = identifierField({ identifier: 'email' });
  const [identifier, setIdentifier] = useState('');
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const busy = useRef(false);
  const [wait, setWait] = useCodeWait();

  const idError = touched ? id.error(identifier) : undefined;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy.current || wait > 0) return;
    setTouched(true);
    if (id.error(identifier)) return;
    setError(undefined);
    busy.current = true;
    setLoading(true);
    try {
      await requestCode(identifier.trim());
      navigate('/codigo', { state: { email: identifier.trim(), from }, replace: true });
    } catch (err) {
      setError(mensagemDoCodigo(err));
      if (codigoDoErro(err) === 'muitas-tentativas') setWait(ESPERA_PARA_REENVIAR);
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }

  return (
    <Stack component="form" spacing={2.5} onSubmit={submit} noValidate>
      <AuthHeading
        title={text(config.title, 'Entrar')}
        subtitle={text(config.subtitle, 'Informe seu e-mail para receber um código de entrada.')}
      />
      {error && <Alert severity="error">{error}</Alert>}
      <TextField
        size="large"
        label={id.label}
        type={id.type}
        autoComplete={id.autoComplete}
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        error={!!idError}
        helperText={idError}
        fullWidth
        disabled={loading}
        autoFocus
      />
      <Button type="submit" variant="contained" size="large" loading={loading} disabled={wait > 0}>
        {loading ? 'Enviando…' : wait > 0 ? `Enviar novamente em ${wait}s` : 'Enviar código'}
      </Button>
    </Stack>
  );
}
