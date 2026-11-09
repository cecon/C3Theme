import { useState } from 'react';

// material-ui
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// third-party
import { ArrowSwapHorizontal, Cloud, Lock1, MessageNotif, Profile2User } from 'iconsax-reactjs';

import { Dot, notify, SoftAvatar, SoftIconButton, toneMain } from '@c3theme/ui';
import { BALANCE_ACCOUNTS, STORAGE_TOTAL_GB, STORAGE_USAGE, TEAM_ACCESS } from '../data';
import { formatBRL, formatPercent } from '../kit/format';
import { Period } from '../kit/period';
import { PeriodMenu } from '../kit/PeriodMenu';
import Tile from '../kit/Tile';
import { toTone } from '../kit/tone';

const ACCESS_BY_PERIOD: Record<Period, number> = { dia: 7, semana: 18, mes: 42, ano: 126 };

/** Quem tem acesso a um projeto: grupo de avatares e total de pessoas no período. */
export function TeamAccessCard() {
  const [period, setPeriod] = useState<Period>('mes');
  return (
    <Tile>
      <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="subtitle1">Projeto Atlas</Typography>
          <Typography variant="body2" color="text.secondary">
            {ACCESS_BY_PERIOD[period]} pessoas acessaram
          </Typography>
        </Box>
        <PeriodMenu value={period} onChange={setPeriod} />
      </Stack>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
        <AvatarGroup max={5} sx={{ '& .MuiAvatar-root': { width: 34, height: 34, fontSize: 13 } }}>
          {TEAM_ACCESS.map((p, i) => (
            <Tooltip key={p.name} title={p.name}>
              <Avatar sx={(theme) => ({ bgcolor: toneMain(theme, (['primary', 'info', 'success', 'warning', 'danger'] as const)[i % 5]) })}>
                {p.initials}
              </Avatar>
            </Tooltip>
          ))}
        </AvatarGroup>
        <SoftIconButton aria-label="Convidar pessoa" onClick={() => notify('Convite enviado por e-mail.', 'success')}>
          <Profile2User size={18} />
        </SoftIconButton>
      </Stack>
    </Tile>
  );
}

/** Chamada para assinar o plano completo. */
export function UpgradeCard() {
  return (
    <Tile sx={{ textAlign: 'center' }}>
      <SoftAvatar tone="warning" size="lg" sx={{ mx: 'auto' }}>
        <Lock1 size={26} variant="Bulk" />
      </SoftAvatar>
      <Typography variant="h5" sx={{ mt: 1.5 }}>
        Recursos do plano Empresa
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
        Relatórios agendados, auditoria e usuários ilimitados.
      </Typography>
      <Button variant="contained" color="warning" onClick={() => notify('Pedido de upgrade enviado ao financeiro.', 'info')}>
        Liberar recursos
      </Button>
    </Tile>
  );
}

/** Uso do armazenamento em nuvem, com barra segmentada por tipo de arquivo. */
export function StorageCard() {
  const used = STORAGE_USAGE.reduce((sum, s) => sum + s.gb, 0);
  return (
    <Tile>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <SoftAvatar tone="info" variant="rounded">
          <Cloud size={22} variant="Bulk" />
        </SoftAvatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1">Armazenamento</Typography>
          <Typography variant="body2" color="text.secondary">
            {used.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} GB de {STORAGE_TOTAL_GB} GB ·{' '}
            <Box component="span" sx={{ color: 'text.primary', fontWeight: 600 }}>
              {formatPercent((used / STORAGE_TOTAL_GB) * 100)}
            </Box>
          </Typography>
        </Box>
      </Stack>
      <Stack
        direction="row"
        role="img"
        aria-label={`Armazenamento usado: ${formatPercent((used / STORAGE_TOTAL_GB) * 100)}`}
        sx={{ mt: 2, height: 10, borderRadius: 5, overflow: 'hidden', bgcolor: 'action.hover', gap: '2px' }}
      >
        {STORAGE_USAGE.map((s) => (
          <Box key={s.label} sx={{ width: `${(s.gb / STORAGE_TOTAL_GB) * 100}%`, bgcolor: `${s.tone}.main` }} />
        ))}
      </Stack>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 1, mt: 2 }}>
        {STORAGE_USAGE.map((s) => (
          <Stack key={s.label} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Dot tone={toTone(s.tone)} />
            <Typography variant="caption" color="text.secondary" noWrap>
              {s.label} · {s.gb.toLocaleString('pt-BR')} GB
            </Typography>
          </Stack>
        ))}
      </Box>
    </Tile>
  );
}

/** Saldo em destaque que alterna entre as contas. */
export function BalanceCard() {
  const [index, setIndex] = useState(0);
  const account = BALANCE_ACCOUNTS[index];
  return (
    <Paper
      sx={(theme) => ({
        borderRadius: 3,
        p: 2.5,
        bgcolor: theme.vars.palette.primary.main,
        color: theme.vars.palette.primary.contrastText,
        backgroundImage: `linear-gradient(135deg, transparent 40%, rgb(0 0 0 / 0.18))`
      })}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="body2" sx={{ color: 'inherit', opacity: 0.85 }}>
            {account.label}
          </Typography>
          <Typography variant="h3" component="p" sx={{ color: 'inherit' }}>
            {formatBRL(account.value)}
          </Typography>
        </Box>
        <Tooltip title="Trocar de conta">
          <Box
            component="button"
            type="button"
            aria-label="Trocar de conta"
            onClick={() => setIndex((i) => (i + 1) % BALANCE_ACCOUNTS.length)}
            sx={{
              all: 'unset',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: 'rgb(255 255 255 / 0.18)',
              '&:hover': { bgcolor: 'rgb(255 255 255 / 0.28)' },
              '&:focus-visible': { outline: '2px solid currentColor' }
            }}
          >
            <ArrowSwapHorizontal size={22} />
          </Box>
        </Tooltip>
      </Stack>
    </Paper>
  );
}

/** Aviso com avatar, mensagem e uma ação. */
export function NoticeCard() {
  const [read, setRead] = useState(false);
  return (
    <Tile>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
        <SoftAvatar tone="success">
          <MessageNotif size={20} />
        </SoftAvatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Typography variant="subtitle1">Fechamento de março</Typography>
            {!read && <Dot tone="success" />}
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Mariana Costa enviou o relatório contábil para sua aprovação.
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
            <Button size="small" variant="contained" onClick={() => notify('Relatório aprovado.', 'success')}>
              Aprovar
            </Button>
            <Button size="small" color="inherit" onClick={() => setRead(true)} disabled={read}>
              {read ? 'Lido' : 'Marcar como lido'}
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Tile>
  );
}
