import { FormEvent, useState } from 'react';
import { useSearchParams } from 'react-router';

// material-ui
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { notify, Panel, PasswordStrength, SoftAvatar } from '@c3theme/ui';
import { useAuth } from '../session';
import { errorMessage, newPasswordError, PasswordField } from './shared';

function PersonalData() {
  const { user, token, port, setUser } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      setUser(await port.updateProfile!(token ?? '', { name: name.trim(), phone: phone.trim() }));
      notify('Perfil atualizado.');
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box component="form" onSubmit={submit} noValidate>
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={!name.trim()}
            helperText={!name.trim() && 'Informe o nome.'}
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField label="E-mail" value={user?.email ?? ''} fullWidth disabled helperText="Para trocar o e-mail, fale com o suporte." />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField label="Telefone" value={phone} onChange={(e) => setPhone(e.target.value)} fullWidth autoComplete="tel" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField label="Perfil de acesso" value={user?.role ?? ''} fullWidth disabled />
        </Grid>
        <Grid size={12}>
          <Button type="submit" variant="contained" loading={saving}>
            Salvar
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}

function ChangePassword() {
  const { token, port } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const nextError = newPasswordError(next);
  const confirmError = confirm !== next ? 'As senhas não conferem.' : undefined;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!current || nextError || confirmError) return;
    setSaving(true);
    setError(undefined);
    try {
      await port.changePassword!(token ?? '', current, next);
      notify('Senha alterada.');
      setCurrent('');
      setNext('');
      setConfirm('');
      setTouched(false);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Stack component="form" spacing={2.5} onSubmit={submit} noValidate sx={{ maxWidth: 420 }}>
      {error && <Alert severity="error">{error}</Alert>}
      <PasswordField
        label="Senha atual"
        autoComplete="current-password"
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
        error={touched && !current}
        helperText={touched && !current && 'Informe a senha atual.'}
      />
      <Stack spacing={1}>
        <PasswordField
          label="Senha nova"
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          error={touched && !!nextError}
          helperText={touched && nextError}
        />
        <PasswordStrength password={next} />
      </Stack>
      <PasswordField
        label="Confirmar senha nova"
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        error={touched && !!confirmError}
        helperText={touched && confirmError}
      />
      <Box>
        <Button type="submit" variant="contained" loading={saving}>
          Alterar senha
        </Button>
      </Box>
    </Stack>
  );
}

/** Meu perfil (`auth.profile`): dados pessoais com `AuthPort.updateProfile` e senha com `changePassword`. */
export default function ProfilePage() {
  const { user, port } = useAuth();
  const [params, setParams] = useSearchParams();
  const canEdit = Boolean(port.updateProfile);
  const canChange = port.entrada !== 'codigo' && Boolean(port.changePassword);
  const tab = (params.get('aba') === 'senha' && canChange) || !canEdit ? 'senha' : 'dados';
  if (!user) return null;
  const initials = user.name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  return (
    <Stack spacing={3}>
      <Panel>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <SoftAvatar size="lg">{initials}</SoftAvatar>
          <Box>
            <Typography variant="h4">{user.name}</Typography>
            <Typography color="text.secondary">
              {user.email}
              {user.role && ` · ${user.role}`}
            </Typography>
          </Box>
        </Stack>
      </Panel>
      <Panel flush>
        <Tabs
          value={tab}
          onChange={(_, v) => setParams(v === 'dados' ? {} : { aba: v }, { replace: true })}
          sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          {canEdit && <Tab value="dados" label="Dados pessoais" />}
          {canChange && <Tab value="senha" label="Senha" />}
        </Tabs>
        <Box sx={{ p: 2.5 }}>{tab === 'dados' ? <PersonalData /> : <ChangePassword />}</Box>
      </Panel>
    </Stack>
  );
}
