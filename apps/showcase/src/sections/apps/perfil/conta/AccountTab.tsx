// Aba de conta: acesso e segurança.
import { useState } from 'react';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { Mobile, Monitor } from 'iconsax-reactjs';
import { notify, Panel, SoftAvatar, StatusChip } from '@c3theme/ui';
import ConfirmDialog from '../../faturas/ConfirmDialog';
import { DEVICES, SESSIONS, useProfile } from '../data';
import { PreferenceList } from '../forms';

const SIGN_IN = [
  { id: 'google', title: 'Google', description: 'ana.souza@gmail.com' },
  { id: 'microsoft', title: 'Microsoft', description: 'Entrar com a conta corporativa' },
  { id: 'apple', title: 'Apple', description: 'Entrar com o Apple ID' }
];
const SECURITY = [
  { id: 'twofa', title: 'Verificação em duas etapas', description: 'Pede um código do app autenticador a cada novo acesso.' },
  { id: 'alerta', title: 'Avisar sobre acessos desconhecidos', description: 'E-mail quando alguém entrar de um dispositivo novo.' }
];

export function AccountTab() {
  const [p] = useProfile();
  const [username, setUsername] = useState('ana.souza');
  const [language, setLanguage] = useState('pt-BR');
  const [linked, setLinked] = useState<Record<string, boolean>>({
    google: true,
    microsoft: false,
    apple: false,
    twofa: true,
    alerta: true
  });
  const [sessions, setSessions] = useState(SESSIONS);
  const [devices, setDevices] = useState(DEVICES);
  const [ending, setEnding] = useState<string | null>(null);
  const usernameError = /^[a-z0-9._]{3,30}$/.test(username) ? undefined : 'Use de 3 a 30 letras minúsculas, números, ponto ou _.';

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, lg: 6 }}>
        <Stack spacing={3}>
          <Panel title="Dados de acesso">
            <Stack spacing={2.5}>
              <TextField
                label="Nome de usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                error={!!usernameError}
                helperText={usernameError ?? `c3theme.dev/@${username}`}
              />
              <TextField label="E-mail da conta" value={p.email} disabled helperText='Altere em "Dados pessoais".' />
              <TextField select label="Idioma" value={language} onChange={(e) => setLanguage(e.target.value)}>
                <MenuItem value="pt-BR">Português (Brasil)</MenuItem>
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="es">Español</MenuItem>
              </TextField>
              <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
                <Button variant="contained" disabled={!!usernameError} onClick={() => notify('Dados de acesso salvos.')}>
                  Salvar
                </Button>
              </Stack>
            </Stack>
          </Panel>
          <Panel title="Formas de entrar">
            <PreferenceList
              items={SIGN_IN}
              value={linked}
              onChange={(id, on) => {
                setLinked((l) => ({ ...l, [id]: on }));
                notify(on ? `Conta ${id} conectada.` : `Conta ${id} desconectada.`, 'info');
              }}
            />
          </Panel>
          <Panel title="Segurança">
            <PreferenceList items={SECURITY} value={linked} onChange={(id, on) => setLinked((l) => ({ ...l, [id]: on }))} />
          </Panel>
        </Stack>
      </Grid>
      <Grid size={{ xs: 12, lg: 6 }}>
        <Stack spacing={3}>
          <Panel
            title="Sessões ativas"
            flush
            action={
              sessions.length > 1 && (
                <Button size="small" color="error" onClick={() => setEnding('outras')}>
                  Encerrar as outras
                </Button>
              )
            }
          >
            <List disablePadding>
              {sessions.map((s) => (
                <ListItem key={s.id} divider sx={{ px: 2.5, gap: 1 }}>
                  <ListItemAvatar>
                    <SoftAvatar tone={s.current ? 'success' : 'neutral'} variant="rounded">
                      {s.kind === 'mobile' ? <Mobile size={18} /> : <Monitor size={18} />}
                    </SoftAvatar>
                  </ListItemAvatar>
                  <ListItemText primary={s.device} secondary={`${s.place} · ${s.when}`} />
                  {s.current ? (
                    <StatusChip label="Esta sessão" tone="success" />
                  ) : (
                    <Button size="small" color="error" onClick={() => setEnding(s.id)}>
                      Encerrar
                    </Button>
                  )}
                </ListItem>
              ))}
            </List>
          </Panel>
          <Panel title="Dispositivos reconhecidos" flush>
            <List disablePadding>
              {devices.map((d) => (
                <ListItem key={d.id} divider sx={{ px: 2.5, gap: 1 }}>
                  <ListItemText primary={d.name} secondary={`${d.detail} · último acesso ${d.last}`} />
                  <Button
                    size="small"
                    color="inherit"
                    onClick={() => {
                      setDevices((l) => l.filter((x) => x.id !== d.id));
                      notify(`"${d.name}" vai pedir verificação no próximo acesso.`, 'info');
                    }}
                  >
                    Esquecer
                  </Button>
                </ListItem>
              ))}
              {devices.length === 0 && (
                <ListItem sx={{ px: 2.5 }}>
                  <ListItemText secondary="Nenhum dispositivo reconhecido." />
                </ListItem>
              )}
            </List>
          </Panel>
        </Stack>
      </Grid>
      <ConfirmDialog
        open={ending !== null}
        title={ending === 'outras' ? 'Encerrar as outras sessões?' : 'Encerrar sessão?'}
        description="O dispositivo terá que entrar de novo com e-mail e senha."
        confirmLabel="Encerrar"
        onClose={() => setEnding(null)}
        onConfirm={() => {
          setSessions((l) => l.filter((s) => s.current || (ending !== 'outras' && s.id !== ending)));
          notify('Sessão encerrada.');
        }}
      />
    </Grid>
  );
}

// ---------------------------------------------------------------- configurações
