import { FormEvent, useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router';

// material-ui
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { useText } from '../../context';
import { canRecover, canRegister } from '../port';
import { useAuth } from '../session';
import { AuthHeading, errorMessage, identifierField, PasswordField } from './shared';

const REMEMBER_KEY = 'c3.remember';

const stored = () => {
  try {
    return localStorage.getItem(REMEMBER_KEY) ?? '';
  } catch {
    return '';
  }
};

/** Entrar, montado por `auth` do app.json: título, identificador, "Lembrar", "Esqueci a senha" e "Cadastre-se". */
export default function LoginPage() {
  const { login, config, port } = useAuth();
  const text = useText();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/';
  const id = identifierField(config);
  const rememberOn = config.remember !== false;
  const recover = canRecover(config, port);
  const [identifier, setIdentifier] = useState(() => (rememberOn ? stored() : ''));
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(() => rememberOn && !!stored());
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const idError = touched ? id.error(identifier) : undefined;
  const passwordError = touched && !password ? 'Informe a senha.' : undefined;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (id.error(identifier) || !password) return;
    setError(undefined);
    setLoading(true);
    try {
      await login(identifier.trim(), password);
      try {
        if (remember) localStorage.setItem(REMEMBER_KEY, identifier.trim());
        else localStorage.removeItem(REMEMBER_KEY);
      } catch {
        /* sem storage */
      }
      // a sessão troca as telas de entrada pelo sistema; o endereço já fica o que o usuário queria
      navigate(from, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      setLoading(false);
    }
  }

  return (
    <Stack component="form" spacing={2.5} onSubmit={submit} noValidate>
      <AuthHeading title={text(config.title, 'Entrar')} subtitle={text(config.subtitle, 'Acesse sua conta.')} />
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
        autoFocus={!identifier}
      />
      <PasswordField
        size="large"
        label="Senha"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={!!passwordError}
        helperText={passwordError}
        fullWidth
        autoFocus={!!identifier}
      />
      {(rememberOn || recover) && (
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          {rememberOn ? (
            <FormControlLabel control={<Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)} />} label="Lembrar" />
          ) : (
            <span />
          )}
          {recover && (
            <Link component={RouterLink} to="/forgot-password" variant="body2">
              Esqueci a senha
            </Link>
          )}
        </Stack>
      )}
      <Button type="submit" variant="contained" size="large" loading={loading}>
        Entrar
      </Button>
      {canRegister(config, port) && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          Não tem conta?{' '}
          <Link component={RouterLink} to="/register">
            Cadastre-se
          </Link>
        </Typography>
      )}
    </Stack>
  );
}
