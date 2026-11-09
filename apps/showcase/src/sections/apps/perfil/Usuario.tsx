import { ElementType, useState } from 'react';
import { useSearchParams } from 'react-router';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import type { Theme } from '@mui/material/styles';

// third-party
import { Card, Location, Lock, Setting2, Sms, UserEdit } from 'iconsax-reactjs';

import { CircularWithLabel, notify, Panel, SoftAvatar } from '@c3theme/ui';
import { completion, fullName, initials, useProfile } from './data';
import { PasswordForm, PersonalForm, PreferenceList } from './forms';
import PaymentTab from './Pagamento';

type TabKey = 'dados' | 'pagamento' | 'senha' | 'configuracoes';
const TABS: { key: TabKey; label: string; icon: ElementType; title: string; subtitle: string }[] = [
  {
    key: 'dados',
    label: 'Dados pessoais',
    icon: UserEdit,
    title: 'Dados pessoais',
    subtitle: 'Como você aparece para a equipe e nos documentos.'
  },
  { key: 'pagamento', label: 'Pagamento', icon: Card, title: 'Pagamento', subtitle: 'Cartões salvos e histórico de cobranças.' },
  { key: 'senha', label: 'Senha', icon: Lock, title: 'Trocar senha', subtitle: 'Recomendamos trocar a senha a cada 6 meses.' },
  { key: 'configuracoes', label: 'Configurações', icon: Setting2, title: 'Configurações', subtitle: 'Notificações, idioma e privacidade.' }
];

function ProfileCard({ tab, onTab }: { tab: TabKey; onTab: (t: TabKey) => void }) {
  const [profile] = useProfile();
  const { percent, missing } = completion(profile);
  const desktop = useMediaQuery((t: Theme) => t.breakpoints.up('md'), { noSsr: true });
  return (
    <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
      <Box
        sx={(theme) => ({
          height: 72,
          background: `linear-gradient(120deg, ${theme.vars.palette.primary.main}, rgb(${theme.vars.palette.primary.mainChannel} / 0.45))`
        })}
      />
      <Stack sx={{ alignItems: 'center', textAlign: 'center', px: 2.5, mt: -5 }}>
        <SoftAvatar size="xl" look="filled" sx={{ border: 4, borderColor: 'background.paper', boxSizing: 'content-box' }}>
          {initials(profile)}
        </SoftAvatar>
        <Typography variant="h5" sx={{ mt: 1.5 }}>
          {fullName(profile)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {profile.jobTitle || 'Cargo não informado'}
        </Typography>
        <Stack direction="row" spacing={2} sx={{ mt: 1.5, color: 'text.secondary', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <Sms size={14} />
            <Typography variant="caption">{profile.email}</Typography>
          </Stack>
          {profile.city && (
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
              <Location size={14} />
              <Typography variant="caption">
                {profile.city}/{profile.state}
              </Typography>
            </Stack>
          )}
        </Stack>
      </Stack>

      <Stack
        direction="row"
        divider={<Divider orientation="vertical" flexItem />}
        sx={{ my: 2.5, mx: 2.5, justifyContent: 'space-around' }}
      >
        {[
          ['86', 'Faturas'],
          ['40', 'Clientes'],
          ['12', 'Projetos']
        ].map(([n, l]) => (
          <Box key={l} sx={{ textAlign: 'center', flex: 1 }}>
            <Typography variant="h5">{n}</Typography>
            <Typography variant="caption" color="text.secondary">
              {l}
            </Typography>
          </Box>
        ))}
      </Stack>

      <Box sx={{ mx: 2.5, mb: 2.5, p: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <CircularWithLabel value={percent} size={56} color={percent === 100 ? 'success' : 'primary'} />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2">{percent === 100 ? 'Perfil completo!' : 'Complete seu perfil'}</Typography>
            <Typography variant="caption" color="text.secondary">
              {missing.length ? `Falta: ${missing.map((m) => m.label.toLowerCase()).join(', ')}.` : 'Todos os dados preenchidos.'}
            </Typography>
          </Box>
        </Stack>
        {missing.length > 0 && tab !== 'dados' && (
          <Button size="small" fullWidth sx={{ mt: 1.5 }} onClick={() => onTab('dados')}>
            Completar agora
          </Button>
        )}
      </Box>

      <Divider />
      <Tabs
        orientation={desktop ? 'vertical' : 'horizontal'}
        variant={desktop ? 'standard' : 'scrollable'}
        allowScrollButtonsMobile
        value={tab}
        onChange={(_, v: TabKey) => onTab(v)}
        aria-label="Seções do perfil"
        sx={{
          '& .MuiTab-root': { justifyContent: desktop ? 'flex-start' : 'center', minHeight: 48, px: 2.5, textTransform: 'none' },
          '& .MuiTabs-indicator': desktop ? { left: 0, right: 'auto' } : {}
        }}
      >
        {TABS.map((t) => (
          <Tab key={t.key} value={t.key} label={t.label} icon={<t.icon size={18} />} iconPosition="start" />
        ))}
      </Tabs>
    </Paper>
  );
}

const NOTIFY_PREFS = [
  { id: 'pedido', title: 'Confirmação de pedidos', description: 'Um e-mail a cada pedido aprovado.' },
  { id: 'fatura', title: 'Faturas e cobranças', description: 'Avisos de vencimento e pagamento recebido.' },
  { id: 'resumo', title: 'Resumo semanal', description: 'Os números da semana toda segunda-feira.' },
  { id: 'seguranca', title: 'Alertas de segurança', description: 'Acesso de um dispositivo novo ou troca de senha.' },
  { id: 'sms', title: 'SMS para cobranças urgentes', description: 'Somente faturas vencidas há mais de 5 dias.' }
];
const PRIVACY_PREFS = [
  { id: 'publico', title: 'Perfil visível para a equipe', description: 'Outros membros veem seu cargo e contato.' },
  { id: 'online', title: 'Mostrar quando estou on-line' }
];

function SettingsTab() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    pedido: true,
    fatura: true,
    resumo: false,
    seguranca: true,
    sms: false,
    publico: true,
    online: true
  });
  const [language, setLanguage] = useState('pt-BR');
  const [timezone, setTimezone] = useState('America/Sao_Paulo');
  const change = (id: string, on: boolean) => setPrefs((p) => ({ ...p, [id]: on }));
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="subtitle1">Notificações</Typography>
        <PreferenceList items={NOTIFY_PREFS} value={prefs} onChange={change} />
      </Box>
      <Box>
        <Typography variant="subtitle1">Privacidade</Typography>
        <PreferenceList items={PRIVACY_PREFS} value={prefs} onChange={change} />
      </Box>
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField select label="Idioma" fullWidth value={language} onChange={(e) => setLanguage(e.target.value)}>
            <MenuItem value="pt-BR">Português (Brasil)</MenuItem>
            <MenuItem value="en">English</MenuItem>
            <MenuItem value="es">Español</MenuItem>
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField select label="Fuso horário" fullWidth value={timezone} onChange={(e) => setTimezone(e.target.value)}>
            <MenuItem value="America/Sao_Paulo">Brasília (GMT−3)</MenuItem>
            <MenuItem value="America/Manaus">Manaus (GMT−4)</MenuItem>
            <MenuItem value="America/Rio_Branco">Rio Branco (GMT−5)</MenuItem>
            <MenuItem value="America/Noronha">Fernando de Noronha (GMT−2)</MenuItem>
          </TextField>
        </Grid>
      </Grid>
      <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
        <Button variant="contained" onClick={() => notify('Configurações salvas.')}>
          Salvar configurações
        </Button>
      </Stack>
    </Stack>
  );
}

export default function UserProfilePage() {
  const [params, setParams] = useSearchParams();
  const raw = params.get('aba');
  const tab: TabKey = TABS.some((t) => t.key === raw) ? (raw as TabKey) : 'dados';
  const current = TABS.find((t) => t.key === tab)!;
  const setTab = (t: TabKey) => setParams(t === 'dados' ? {} : { aba: t }, { replace: true });

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 4, xl: 3 }}>
        <ProfileCard tab={tab} onTab={setTab} />
      </Grid>
      <Grid size={{ xs: 12, md: 8, xl: 9 }}>
        <Panel title={current.title} subtitle={current.subtitle}>
          {tab === 'dados' && <PersonalForm />}
          {tab === 'pagamento' && <PaymentTab />}
          {tab === 'senha' && <PasswordForm />}
          {tab === 'configuracoes' && <SettingsTab />}
        </Panel>
      </Grid>
    </Grid>
  );
}
