// Aba de perfil: resumo, habilidades e linha do tempo.
import { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Book, Briefcase, Call, Global, Location, Sms } from 'iconsax-reactjs';
import { LinearWithLabel, Panel, SoftAvatar, StatusChip } from '@c3theme/ui';
import { fullName, initials, useProfile } from '../data';

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Grid container spacing={1} sx={{ py: 1 }}>
      <Grid size={{ xs: 12, sm: 4 }}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      </Grid>
      <Grid size={{ xs: 12, sm: 8 }}>
        <Typography variant="body2">{value || '—'}</Typography>
      </Grid>
    </Grid>
  );
}

const SKILLS = [
  { label: 'Gestão financeira', value: 90 },
  { label: 'Atendimento ao cliente', value: 82 },
  { label: 'Análise de dados', value: 68 },
  { label: 'Negociação', value: 74 }
];
const TIMELINE = [
  { title: 'Gerente de operações', place: 'C3 Soluções Digitais', period: '2023 – atual', kind: 'Experiência' },
  { title: 'Analista financeira sênior', place: 'Grupo Ipê Amarelo', period: '2018 – 2023', kind: 'Experiência' },
  { title: 'MBA em Gestão Empresarial', place: 'Fundação de Ensino Paulista', period: '2016 – 2017', kind: 'Formação' },
  { title: 'Bacharelado em Administração', place: 'Universidade Estadual de Campinas', period: '2008 – 2012', kind: 'Formação' }
];

export function ProfileOverview({ onEdit }: { onEdit: () => void }) {
  const [p] = useProfile();
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 5, lg: 4 }}>
        <Stack spacing={3}>
          <Panel>
            <Stack sx={{ alignItems: 'center', textAlign: 'center' }}>
              <SoftAvatar size="xl">{initials(p)}</SoftAvatar>
              <Typography variant="h5" sx={{ mt: 1.5 }}>
                {fullName(p)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {p.jobTitle}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                <StatusChip label="Proprietária" tone="primary" />
                <StatusChip label="Verificada" tone="success" />
              </Stack>
            </Stack>
            <Divider sx={{ my: 2.5 }} />
            <List disablePadding dense>
              {[
                { icon: Sms, text: p.email },
                { icon: Call, text: p.phone },
                { icon: Location, text: p.city ? `${p.city}/${p.state}` : '' },
                { icon: Global, text: p.website }
              ]
                .filter((i) => i.text)
                .map(({ icon: Icon, text }) => (
                  <ListItem key={text} disableGutters>
                    <Box sx={{ color: 'text.secondary', display: 'flex', mr: 1.5 }}>
                      <Icon size={18} />
                    </Box>
                    <ListItemText primary={text} slotProps={{ primary: { noWrap: true } }} />
                  </ListItem>
                ))}
            </List>
          </Panel>
          <Panel title="Habilidades">
            <Stack spacing={2}>
              {SKILLS.map((s) => (
                <LinearWithLabel key={s.label} label={s.label} value={s.value} />
              ))}
            </Stack>
          </Panel>
        </Stack>
      </Grid>
      <Grid size={{ xs: 12, md: 7, lg: 8 }}>
        <Stack spacing={3}>
          <Panel
            title="Sobre"
            action={
              <Button size="small" onClick={onEdit}>
                Editar
              </Button>
            }
          >
            <Typography color={p.bio ? 'text.primary' : 'text.secondary'}>
              {p.bio || 'Você ainda não escreveu sobre você. Conte um pouco da sua trajetória em "Dados pessoais".'}
            </Typography>
          </Panel>
          <Panel title="Dados pessoais">
            <Stack divider={<Divider />}>
              <InfoRow label="Nome completo" value={fullName(p)} />
              <InfoRow label="CPF" value={p.cpf} />
              <InfoRow label="Nascimento" value={p.birthDate} />
              <InfoRow
                label="Endereço"
                value={[p.address, p.city && `${p.city}/${p.state}`, p.zip && `CEP ${p.zip}`].filter(Boolean).join(' · ')}
              />
            </Stack>
          </Panel>
          <Panel title="Trajetória">
            <Stack spacing={2.5}>
              {TIMELINE.map((t) => (
                <Stack key={t.title} direction="row" spacing={2}>
                  <SoftAvatar size="sm" tone={t.kind === 'Formação' ? 'info' : 'primary'} variant="rounded">
                    {t.kind === 'Formação' ? <Book size={16} /> : <Briefcase size={16} />}
                  </SoftAvatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle2">{t.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t.place} · {t.period}
                    </Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
          </Panel>
        </Stack>
      </Grid>
    </Grid>
  );
}

// ---------------------------------------------------------------- minha conta
