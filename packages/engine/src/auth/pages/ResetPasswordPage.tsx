import { FormEvent, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';

// material-ui
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

import { notify, PasswordStrength } from '@c3theme/ui';
import { useAuth } from '../session';
import { AuthHeading, errorMessage, newPasswordError, PasswordField } from './shared';

/** Senha nova com o código verificado (`AuthPort.resetPassword`). */
export default function ResetPasswordPage() {
  const { port } = useAuth();
  const state = useLocation().state as { email?: string; code?: string } | null;
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  if (!state?.email || !state.code) return <Navigate to="/forgot-password" replace />;

  const passwordError = newPasswordError(password);
  const confirmError = confirm !== password ? 'As senhas não conferem.' : undefined;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (passwordError || confirmError) return;
    setLoading(true);
    setError(undefined);
    try {
      await port.resetPassword!(state!.email!, state!.code!, password);
      notify('Senha alterada. Entre com a senha nova.');
      navigate('/login', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Stack component="form" spacing={2.5} onSubmit={submit} noValidate>
      <AuthHeading title="Nova senha" subtitle={`Crie uma senha nova para ${state.email}.`} />
      {error && <Alert severity="error">{error}</Alert>}
      <Stack spacing={1}>
        <PasswordField
          size="large"
          label="Senha nova"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={touched && !!passwordError}
          helperText={touched && passwordError}
          fullWidth
          autoFocus
        />
        <PasswordStrength password={password} />
      </Stack>
      <PasswordField
        size="large"
        label="Confirmar senha"
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        error={touched && !!confirmError}
        helperText={touched && confirmError}
        fullWidth
      />
      <Button type="submit" variant="contained" size="large" loading={loading}>
        Salvar senha
      </Button>
    </Stack>
  );
}
