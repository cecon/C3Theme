import { useMemo, useState } from 'react';

// material-ui
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import InputAdornment from '@mui/material/InputAdornment';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

// third-party
import { Briefcase, Call, Location, SearchNormal1, Sms } from 'iconsax-reactjs';

import { Dot, notify, Panel, SoftAvatar, SoftIconButton, Tone } from '@c3theme/ui';
import { JOB, NEW_CUSTOMERS, PEOPLE, Person, USER_ACTIVITY } from '../data';

const TONES: Tone[] = ['primary', 'info', 'success', 'warning', 'danger', 'secondary'];
const toneOf = (i: number) => TONES[i % TONES.length];

/** Avatar com o pontinho de "online" no canto. */
function PersonAvatar({ person, index, size = 'md' }: { person: Person; index: number; size?: 'sm' | 'md' }) {
  return (
    <Badge
      overlap="circular"
      variant="dot"
      invisible={!person.online}
      color="success"
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      sx={{ '& .MuiBadge-badge': { boxShadow: (theme) => `0 0 0 2px ${theme.vars.palette.background.paper}` } }}
    >
      <SoftAvatar tone={toneOf(index)} size={size}>
        {person.initials}
      </SoftAvatar>
    </Badge>
  );
}

/** Pessoas da equipe com cargo e status. */
export function TeamMembersCard() {
  return (
    <Panel
      title="Equipe"
      action={
        <Link component="button" variant="body2" onClick={() => notify('Abrindo diretório da equipe…', 'info')}>
          Ver todos
        </Link>
      }
      flush
    >
      <List disablePadding>
        {PEOPLE.slice(0, 5).map((p, i) => (
          <ListItem key={p.email} divider={i < 4} sx={{ px: 2.5 }}>
            <ListItemAvatar>
              <PersonAvatar person={p} index={i} />
            </ListItemAvatar>
            <ListItemText primary={p.name} secondary={p.role} slotProps={{ primary: { variant: 'subtitle2' } }} />
            <Typography variant="caption" color={p.online ? 'success.main' : 'text.secondary'}>
              {p.online ? 'Online' : 'Ausente'}
            </Typography>
          </ListItem>
        ))}
      </List>
    </Panel>
  );
}

/** Clientes cadastrados recentemente, com rolagem. */
export function NewCustomersCard() {
  return (
    <Panel title="Novos clientes" subtitle={`${NEW_CUSTOMERS.length} nas últimas 24 horas`} flush>
      <List disablePadding sx={{ maxHeight: 340, overflowY: 'auto' }}>
        {NEW_CUSTOMERS.map((c, i) => (
          <ListItem key={c.name} divider={i < NEW_CUSTOMERS.length - 1} sx={{ px: 2.5 }}>
            <ListItemAvatar>
              <SoftAvatar tone={toneOf(i)}>{c.initials}</SoftAvatar>
            </ListItemAvatar>
            <ListItemText primary={c.name} secondary={`${c.city} · ${c.when}`} slotProps={{ primary: { variant: 'subtitle2' } }} />
            <Chip size="small" variant="outlined" label={`${c.orders} ${c.orders === 1 ? 'pedido' : 'pedidos'}`} />
          </ListItem>
        ))}
      </List>
    </Panel>
  );
}

/** O que cada pessoa fez por último. */
export function UserActivityCard() {
  return (
    <Panel title="Atividade dos usuários" flush>
      <List disablePadding>
        {USER_ACTIVITY.map((a, i) => {
          const p = PEOPLE[a.person];
          return (
            <ListItem key={i} divider={i < USER_ACTIVITY.length - 1} alignItems="flex-start" sx={{ px: 2.5 }}>
              <ListItemAvatar>
                <PersonAvatar person={p} index={a.person} />
              </ListItemAvatar>
              <ListItemText
                primary={
                  <>
                    <Box component="span" sx={{ fontWeight: 600 }}>
                      {p.name}
                    </Box>{' '}
                    {a.action}
                  </>
                }
                secondary={a.when}
              />
            </ListItem>
          );
        })}
      </List>
    </Panel>
  );
}

/** Agenda de contatos com busca e atalhos para ligar e mandar e-mail. */
export function ContactsCard() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PEOPLE.map((p, i) => ({ p, i })).filter(({ p }) => !q || `${p.name} ${p.role} ${p.city}`.toLowerCase().includes(q));
  }, [query]);
  const current = PEOPLE[selected];

  return (
    <Panel title="Contatos" flush>
      <Box sx={{ p: 2 }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Buscar por nome, cargo ou cidade"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          slotProps={{
            htmlInput: { 'aria-label': 'Buscar contato' },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchNormal1 size={16} />
                </InputAdornment>
              )
            }
          }}
        />
      </Box>
      <List disablePadding dense sx={{ maxHeight: 220, overflowY: 'auto' }}>
        {filtered.map(({ p, i }) => (
          <ListItemButton key={p.email} selected={i === selected} onClick={() => setSelected(i)} sx={{ px: 2 }}>
            <ListItemAvatar sx={{ minWidth: 44 }}>
              <PersonAvatar person={p} index={i} size="sm" />
            </ListItemAvatar>
            <ListItemText primary={p.name} secondary={p.role} />
          </ListItemButton>
        ))}
        {filtered.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1.5 }}>
            Nenhum contato encontrado.
          </Typography>
        )}
      </List>
      <Stack spacing={1} sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle2">{current.name}</Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', color: 'text.secondary' }}>
          <Location size={14} />
          <Typography variant="caption">{current.city}</Typography>
        </Stack>
        <Stack direction="row" spacing={1}>
          <SoftIconButton
            aria-label={`Ligar para ${current.name}`}
            tone="success"
            onClick={() => window.open(`tel:${current.phone.replace(/\D/g, '')}`, '_self')}
          >
            <Call size={18} />
          </SoftIconButton>
          <SoftIconButton aria-label={`Enviar e-mail para ${current.name}`} onClick={() => window.open(`mailto:${current.email}`, '_self')}>
            <Sms size={18} />
          </SoftIconButton>
          <Box sx={{ flex: 1, minWidth: 0, alignSelf: 'center' }}>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
              {current.phone} · {current.email}
            </Typography>
          </Box>
        </Stack>
      </Stack>
    </Panel>
  );
}

/** Vaga em destaque com dados da empresa e botão de candidatura. */
export function JobCard() {
  const [applied, setApplied] = useState(false);
  return (
    <Panel
      footer={
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="subtitle1" color="primary">
            {JOB.salary}
          </Typography>
          <Button
            variant="contained"
            disabled={applied}
            onClick={() => {
              setApplied(true);
              notify('Candidatura enviada.', 'success');
            }}
          >
            {applied ? 'Candidatura enviada' : 'Candidatar-se'}
          </Button>
        </Stack>
      }
    >
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <SoftAvatar tone="primary" variant="rounded" size="lg">
          <Briefcase size={26} variant="Bulk" />
        </SoftAvatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1">{JOB.company}</Typography>
          <Typography variant="caption" color="text.secondary">
            CNPJ {JOB.cnpj}
          </Typography>
        </Box>
      </Stack>
      <Typography variant="h4" sx={{ mt: 2.5 }}>
        {JOB.title}
      </Typography>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', color: 'text.secondary', mt: 0.5 }}>
        <Dot tone="success" />
        <Typography variant="body2">{JOB.location}</Typography>
      </Stack>
      <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1, mt: 2 }}>
        {JOB.skills.map((s) => (
          <Chip key={s} label={s} size="small" />
        ))}
      </Stack>
      <Typography variant="subtitle2" sx={{ mt: 2.5 }}>
        Descrição
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {JOB.description}
      </Typography>
    </Panel>
  );
}
