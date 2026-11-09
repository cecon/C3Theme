import { MouseEvent, useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';

// third-party
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowDown2, ArrowUp2, MoneyRecive, MoneySend, Sort } from 'iconsax-reactjs';

import { LinearWithLabel, notify, Panel, SoftAvatar, StatusChip, Tone } from '@c3theme/ui';
import { INVESTMENTS, PAYMENTS, TRAFFIC, Transaction, TRANSACTIONS } from '../data';
import { formatBRL } from '../kit/format';

const STATUS: Record<Transaction['status'], { label: string; tone: 'success' | 'warning' | 'danger' }> = {
  concluida: { label: 'Concluída', tone: 'success' },
  pendente: { label: 'Pendente', tone: 'warning' },
  falhou: { label: 'Falhou', tone: 'danger' }
};

type TxFilter = 'todas' | Transaction['status'];

/** Movimentações da conta com abas por situação. */
export function TransactionsCard() {
  const [filter, setFilter] = useState<TxFilter>('todas');
  const rows = TRANSACTIONS.filter((t) => filter === 'todas' || t.status === filter);

  return (
    <Panel
      title="Transações"
      flush
      footer={
        <Stack direction="row" spacing={1.5}>
          <Button fullWidth variant="outlined" color="inherit" onClick={() => notify('Extrato exportado em PDF.', 'success')}>
            Exportar extrato
          </Button>
          <Button fullWidth variant="contained" onClick={() => notify('Nova transferência iniciada.', 'info')}>
            Nova transferência
          </Button>
        </Stack>
      }
    >
      <Tabs
        value={filter}
        onChange={(_, v: TxFilter) => setFilter(v)}
        variant="scrollable"
        sx={{ px: 1.5, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab value="todas" label={`Todas (${TRANSACTIONS.length})`} />
        <Tab value="concluida" label="Concluídas" />
        <Tab value="pendente" label="Pendentes" />
        <Tab value="falhou" label="Com falha" />
      </Tabs>
      <List disablePadding sx={{ minHeight: 280 }}>
        {rows.map((t) => {
          const income = t.amount > 0;
          return (
            <ListItem key={t.id} divider sx={{ px: 2.5 }}>
              <ListItemAvatar>
                <SoftAvatar tone={income ? 'success' : 'neutral'} variant="rounded">
                  {income ? <MoneyRecive size={18} /> : <MoneySend size={18} />}
                </SoftAvatar>
              </ListItemAvatar>
              <ListItemText primary={t.name} secondary={t.detail} slotProps={{ primary: { variant: 'subtitle2', noWrap: true } }} />
              <Stack sx={{ alignItems: 'flex-end', flexShrink: 0, ml: 1 }} spacing={0.5}>
                <Typography variant="subtitle2" color={income ? 'success.main' : 'text.primary'}>
                  {income ? '+ ' : '− '}
                  {formatBRL(Math.abs(t.amount))}
                </Typography>
                <StatusChip label={STATUS[t.status].label} tone={STATUS[t.status].tone} />
              </Stack>
            </ListItem>
          );
        })}
        {rows.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2.5 }}>
            Nenhuma transação nesta situação.
          </Typography>
        )}
      </List>
    </Panel>
  );
}

type SortKey = 'nome' | 'data' | 'valor';
const SORT_LABELS: Record<SortKey, string> = { nome: 'Nome', data: 'Data', valor: 'Valor' };

/** Contas pagas no mês, com ordenação por nome, data ou valor. */
export function PaymentHistoryCard() {
  const [sort, setSort] = useState<SortKey>('data');
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const tones: Tone[] = ['primary', 'warning', 'info', 'success', 'secondary'];
  const rows = PAYMENTS.map((p, i) => ({ ...p, tone: tones[i % tones.length] })).sort((a, b) =>
    sort === 'nome' ? a.name.localeCompare(b.name, 'pt-BR') : sort === 'valor' ? b.amount - a.amount : b.date.localeCompare(a.date)
  );

  return (
    <Panel
      title="Histórico de pagamentos"
      subtitle={`Ordenado por ${SORT_LABELS[sort].toLowerCase()}`}
      action={
        <IconButton size="small" aria-label="Ordenar" onClick={(e: MouseEvent<HTMLElement>) => setAnchor(e.currentTarget)}>
          <Sort size={18} />
        </IconButton>
      }
      flush
    >
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
        {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
          <MenuItem
            key={k}
            selected={k === sort}
            onClick={() => {
              setSort(k);
              setAnchor(null);
            }}
          >
            {SORT_LABELS[k]}
          </MenuItem>
        ))}
      </Menu>
      <List disablePadding>
        {rows.map((p, i) => (
          <ListItem key={p.name} divider={i < rows.length - 1} sx={{ px: 2.5 }}>
            <ListItemAvatar>
              <SoftAvatar tone={p.tone} size="sm">
                {p.initials}
              </SoftAvatar>
            </ListItemAvatar>
            <ListItemText
              primary={p.name}
              secondary={format(parseISO(p.date), "d 'de' MMM", { locale: ptBR })}
              slotProps={{ primary: { variant: 'subtitle2', noWrap: true } }}
            />
            <Typography variant="subtitle2" sx={{ flexShrink: 0, ml: 1 }}>
              {formatBRL(p.amount)}
            </Typography>
          </ListItem>
        ))}
      </List>
    </Panel>
  );
}

/** Rendimento do dia por aplicação, positivo ou negativo. */
export function InvestmentsCard() {
  const total = INVESTMENTS.reduce((sum, i) => sum + i.change, 0);
  return (
    <Panel title="Rendimentos de hoje" subtitle={`Saldo do dia: ${total >= 0 ? '+' : '−'} ${formatBRL(Math.abs(total))}`} flush>
      <List disablePadding sx={{ maxHeight: 320, overflowY: 'auto' }}>
        {INVESTMENTS.map((inv, i) => {
          const up = inv.change >= 0;
          return (
            <ListItem key={inv.name} divider={i < INVESTMENTS.length - 1} sx={{ px: 2.5, gap: 1.5 }}>
              <Box sx={{ color: up ? 'success.main' : 'error.main', display: 'flex' }} aria-label={up ? 'Alta' : 'Queda'}>
                {up ? <ArrowUp2 size={18} variant="Bold" /> : <ArrowDown2 size={18} variant="Bold" />}
              </Box>
              <ListItemText primary={inv.name} />
              <Typography variant="subtitle2" sx={{ color: up ? 'success.main' : 'error.main', flexShrink: 0 }}>
                {up ? '+ ' : '− '}
                {formatBRL(Math.abs(inv.change))}
              </Typography>
            </ListItem>
          );
        })}
      </List>
    </Panel>
  );
}

/** Participação de cada origem no tráfego do site. */
export function TrafficSourcesCard() {
  return (
    <Panel title="Origem do tráfego" subtitle="Últimos 30 dias">
      <Stack spacing={2}>
        {TRAFFIC.map((t) => (
          <LinearWithLabel key={t.label} label={t.label} value={t.value} color={t.color} />
        ))}
      </Stack>
    </Panel>
  );
}
