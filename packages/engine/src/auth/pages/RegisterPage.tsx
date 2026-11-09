import { FormEvent, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router';

// material-ui
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { notify, PasswordStrength } from '@c3theme/ui';
import { useAuth } from '../session';
import { AuthHeading, errorMessage, identifierField, newPasswordError, PasswordField } from './shared';

/** Cadastro (`auth.register` e `AuthPort.register`). */
export default function RegisterPage() {
  const { port, config } = useAuth();
  const id = identifierField(config);
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', terms: false });
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const errors = {
    name: !form.name.trim() ? 'Informe seu nome.' : undefined,
    email: id.error(form.email),
    password: newPasswordError(form.password),
    confirm: form.confirm !== form.password ? 'As senhas não conferem.' : undefined,
    terms: !form.terms ? 'Aceite os termos para continuar.' : undefined
  };
  const show = (k: keyof typeof errors) => (touched ? errors[k] : undefined);
  const set = (k: keyof typeof form) => (e: { target: { value: string; checked?: boolean } }) =>
    setForm((f) => ({ ...f, [k]: k === 'terms' ? e.target.checked : e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (Object.values(errors).some(Boolean)) return;
    setError(undefined);
    setLoading(true);
    try {
      await port.register!({ name: form.name.trim(), identifier: form.email.trim(), password: form.password });
      notify('Conta criada. Entre com seus dados.');
      navigate('/login', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Stack component="form" spacing={2.5} onSubmit={submit} noValidate>
      <AuthHeading title="Criar conta" subtitle="Preencha seus dados para começar." />
      {error && <Alert severity="error">{error}</Alert>}
      <TextField
        size="large"
        label="Nome completo"
        autoComplete="name"
        value={form.name}
        onChange={set('name')}
        error={!!show('name')}
        helperText={show('name')}
        fullWidth
        autoFocus
      />
      <TextField
        size="large"
        label={id.label}
        type={id.type}
        autoComplete={id.autoComplete}
        value={form.email}
        onChange={set('email')}
        error={!!show('email')}
        helperText={show('email')}
        fullWidth
      />
      <Stack spacing={1}>
        <PasswordField
          size="large"
          label="Senha"
          autoComplete="new-password"
          value={form.password}
          onChange={set('password')}
          error={!!show('password')}
          helperText={show('password')}
          fullWidth
        />
        <PasswordStrength password={form.password} />
      </Stack>
      <PasswordField
        size="large"
        label="Confirmar senha"
        autoComplete="new-password"
        value={form.confirm}
        onChange={set('confirm')}
        error={!!show('confirm')}
        helperText={show('confirm')}
        fullWidth
      />
      <div>
        <FormControlLabel
          control={<Checkbox checked={form.terms} onChange={set('terms')} />}
          label="Li e aceito os termos de uso e a política de privacidade"
        />
        {show('terms') && <FormHelperText error>{show('terms')}</FormHelperText>}
      </div>
      <Button type="submit" variant="contained" size="large" loading={loading}>
        Criar conta
      </Button>
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
        Já tem conta?{' '}
        <Link component={RouterLink} to="/login">
          Entrar
        </Link>
      </Typography>
    </Stack>
  );
}
