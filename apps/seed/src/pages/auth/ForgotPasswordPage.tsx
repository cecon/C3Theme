import { FormEvent, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router';

// material-ui
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';

import { authService } from '../../auth';
import { AuthHeading, errorMessage, isEmail } from './shared';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const emailError = touched && !isEmail(email) ? 'Informe um e-mail válido.' : undefined;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!isEmail(email)) return;
    setLoading(true);
    setError(undefined);
    try {
      await authService.forgotPassword(email.trim());
      navigate('/check-mail', { state: { email: email.trim() } });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Stack component="form" spacing={2.5} onSubmit={submit} noValidate>
      <AuthHeading title="Esqueci a senha" subtitle="Informe o e-mail da conta. Enviaremos um código para criar uma senha nova." />
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
        autoFocus
      />
      <Button type="submit" variant="contained" size="large" loading={loading}>
        Enviar código
      </Button>
      <Link component={RouterLink} to="/login" variant="body2" sx={{ textAlign: 'center' }}>
        Voltar ao login
      </Link>
    </Stack>
  );
}
