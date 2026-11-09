import { useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { CloseCircle, DocumentText, MoneyRecive, ProfileAdd, ShoppingCart, TaskSquare } from 'iconsax-reactjs';

import { Dot, notify, Panel, SoftAvatar, softColors, Tone } from '@c3theme/ui';
import { FEED, MESSAGES, PEOPLE, POSTS, REQUESTS } from '../data';

const FEED_STYLE = {
  pedido: { icon: ShoppingCart, tone: 'primary' },
  tarefa: { icon: TaskSquare, tone: 'warning' },
  cliente: { icon: ProfileAdd, tone: 'info' },
  pagamento: { icon: MoneyRecive, tone: 'success' },
  cancelamento: { icon: CloseCircle, tone: 'danger' }
} as const;

/** Feed do que aconteceu na loja, com ícone por tipo de evento. */
export function ActivityFeedCard() {
  return (
    <Panel title="Feed de atividades">
      <Stack spacing={2}>
        {FEED.map((f, i) => {
          const { icon: Icon, tone } = FEED_STYLE[f.kind];
          return (
            <Stack key={i} direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <SoftAvatar tone={tone} size="sm" variant="rounded">
                <Icon size={16} />
              </SoftAvatar>
              <Typography variant="body2" sx={{ flex: 1, minWidth: 0 }}>
                {f.text}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                {f.when}
              </Typography>
            </Stack>
          );
        })}
      </Stack>
    </Panel>
  );
}

/** Solicitações internas pendentes; clicar marca como vista. */
export function IncomingRequestsCard() {
  const [seen, setSeen] = useState<number[]>([]);
  return (
    <Panel
      title="Solicitações"
      subtitle={`${REQUESTS.length - seen.length} não vistas`}
      action={
        <Link component="button" variant="body2" onClick={() => setSeen(REQUESTS.map((_, i) => i))}>
          Marcar todas
        </Link>
      }
      flush
    >
      <List disablePadding sx={{ maxHeight: 320, overflowY: 'auto' }}>
        {REQUESTS.map((r, i) => (
          <ListItemButton key={r.text} divider onClick={() => setSeen((s) => (s.includes(i) ? s : [...s, i]))} sx={{ px: 2.5 }}>
            <ListItemIcon sx={{ minWidth: 28 }}>
              <Dot tone={r.tone} size={10} />
            </ListItemIcon>
            <ListItemText
              primary={r.text}
              slotProps={{
                primary: { sx: { fontWeight: seen.includes(i) ? 400 : 600, color: seen.includes(i) ? 'text.secondary' : 'text.primary' } }
              }}
            />
          </ListItemButton>
        ))}
      </List>
    </Panel>
  );
}

/** Últimas mensagens da equipe em balões. */
export function LatestMessagesCard() {
  const tones: Tone[] = ['primary', 'info', 'success', 'warning'];
  return (
    <Panel title="Mensagens recentes">
      <Stack spacing={2}>
        {MESSAGES.map((m, i) => {
          const p = PEOPLE[m.person];
          return (
            <Stack key={i} direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
              <SoftAvatar tone={tones[i % tones.length]} size="sm">
                {p.initials}
              </SoftAvatar>
              <Box sx={{ minWidth: 0 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline' }}>
                  <Typography variant="subtitle2">{p.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {m.when}
                  </Typography>
                </Stack>
                <Box
                  sx={(theme) => ({
                    ...softColors(theme, 'neutral'),
                    color: theme.vars.palette.text.primary,
                    mt: 0.5,
                    px: 1.5,
                    py: 1,
                    borderRadius: 2,
                    borderStartStartRadius: 2
                  })}
                >
                  <Typography variant="body2">{m.text}</Typography>
                </Box>
              </Box>
            </Stack>
          );
        })}
      </Stack>
    </Panel>
  );
}

/** Publicações do blog com miniatura colorida. */
export function LatestPostsCard() {
  return (
    <Panel title="Publicações recentes" flush>
      <List disablePadding>
        {POSTS.map((p, i) => (
          <ListItemButton
            key={p.title}
            divider={i < POSTS.length - 1}
            onClick={() => notify(`Abrindo "${p.title}"…`, 'info')}
            sx={{ px: 2.5, py: 1.5, gap: 2, alignItems: 'flex-start' }}
          >
            <Box
              aria-hidden
              sx={(theme) => ({
                ...softColors(theme, p.tone),
                width: 64,
                height: 64,
                borderRadius: 2,
                flexShrink: 0,
                display: 'grid',
                placeItems: 'center'
              })}
            >
              <DocumentText size={26} variant="Bulk" />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2">{p.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {p.excerpt}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {p.when}
              </Typography>
            </Box>
          </ListItemButton>
        ))}
      </List>
    </Panel>
  );
}
