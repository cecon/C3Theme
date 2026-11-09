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

import { useBranding } from '@c3theme/ui';
import { useAuth, USING_MOCK } from '../../auth';
import { MOCK_CREDENTIALS } from '../../auth-mock';
import { AuthHeading, errorMessage, isEmail, PasswordField } from './shared';

const REMEMBER_KEY = 'c3-remember-email';

export default function LoginPage() {
  const { login } = useAuth();
  const { homePath } = useBranding();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? homePath;
  const [email, setEmail] = useState(() => localStorage.getItem(REMEMBER_KEY) ?? '');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(() => !!localStorage.getItem(REMEMBER_KEY));
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const emailError = touched && !isEmail(email) ? 'Informe um e-mail válido.' : undefined;
  const passwordError = touched && !password ? 'Informe a senha.' : undefined;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!isEmail(email) || !password) return;
    setError(undefined);
    setLoading(true);
    try {
      await login(email, password);
      if (remember) localStorage.setItem(REMEMBER_KEY, email.trim());
      else localStorage.removeItem(REMEMBER_KEY);
      navigate(from, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Stack component="form" spacing={2.5} onSubmit={submit} noValidate>
      <AuthHeading
        title="Entrar"
        subtitle={
          USING_MOCK ? `Modo de demonstração: use ${MOCK_CREDENTIALS.email} e a senha ${MOCK_CREDENTIALS.password}.` : 'Acesse sua conta.'
        }
      />
      {error && <Alert severity="error">{error}</Alert>}
      <TextField
        size="large"
        label="E-mail"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={!!emailError}
        helperText={emailError}
        fullWidth
        autoFocus={!email}
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
        autoFocus={!!email}
      />
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <FormControlLabel
          control={<Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)} />}
          label="Lembrar e-mail"
        />
        <Link component={RouterLink} to="/forgot-password" variant="body2">
          Esqueci a senha
        </Link>
      </Stack>
      <Button type="submit" variant="contained" size="large" loading={loading}>
        Entrar
      </Button>
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
        Não tem conta?{' '}
        <Link component={RouterLink} to="/register">
          Cadastre-se
        </Link>
      </Typography>
    </Stack>
  );
}
