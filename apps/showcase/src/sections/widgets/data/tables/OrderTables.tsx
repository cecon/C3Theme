// Clientes por estado e últimos pedidos.
import { useState } from 'react';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Typography from '@mui/material/Typography';
import { Panel, ScrollX, StatusChip } from '@c3theme/ui';
import { CUSTOMERS_BY_STATE, ORDERS } from '../../data';
import { formatBRL, formatNumber, formatPercent } from '../../kit/format';
import { Head, shortDate, tableSx } from './shared';

/** Clientes e receita por estado, com participação no total. */
export function CustomersByStateTable() {
  const totalRevenue = CUSTOMERS_BY_STATE.reduce((s, r) => s + r.revenue, 0);
  return (
    <Panel title="Clientes por estado" flush>
      <ScrollX>
        <Table size="small" sx={{ ...tableSx, minWidth: 520 }}>
          <Head columns={['Estado', { label: 'Clientes', end: true }, { label: 'Receita', end: true }, 'Participação']} />
          <TableBody>
            {CUSTOMERS_BY_STATE.map((s) => {
              const share = (s.revenue / totalRevenue) * 100;
              return (
                <TableRow key={s.uf} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                      <Chip size="small" label={s.uf} sx={{ fontWeight: 600, minWidth: 40 }} />
                      <span>{s.state}</span>
                    </Stack>
                  </TableCell>
                  <TableCell align="right">{formatNumber(s.customers)}</TableCell>
                  <TableCell align="right">{formatBRL(s.revenue, true)}</TableCell>
                  <TableCell sx={{ minWidth: 140 }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <LinearProgress
                        variant="determinate"
                        value={share}
                        sx={{ flex: 1, height: 6, borderRadius: 3 }}
                        aria-label={`Participação de ${s.state}`}
                      />
                      <Typography variant="caption" sx={{ minWidth: 40, textAlign: 'end' }}>
                        {formatPercent(share)}
                      </Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </ScrollX>
    </Panel>
  );
}

type OrderSort = 'date' | 'total';
const ORDER_STATUSES = ['Todos', ...new Set(ORDERS.map((o) => o.status))];

/** Últimos pedidos: filtro por situação e ordenação por data ou valor. */
export function LatestOrdersTable() {
  const [status, setStatus] = useState('Todos');
  const [sort, setSort] = useState<{ by: OrderSort; dir: 'asc' | 'desc' }>({ by: 'date', dir: 'desc' });
  const rows = ORDERS.filter((o) => status === 'Todos' || o.status === status).sort((a, b) => {
    const diff = sort.by === 'total' ? a.total - b.total : a.date.localeCompare(b.date) || a.id.localeCompare(b.id);
    return sort.dir === 'asc' ? diff : -diff;
  });
  const toggle = (by: OrderSort) => setSort((s) => ({ by, dir: s.by === by && s.dir === 'desc' ? 'asc' : 'desc' }));

  return (
    <Panel title="Últimos pedidos" flush>
      <Stack
        direction="row"
        sx={{ gap: 1, flexWrap: 'wrap', p: 2, borderBottom: 1, borderColor: 'divider' }}
        role="group"
        aria-label="Filtrar por situação"
      >
        {ORDER_STATUSES.map((s) => (
          <Chip
            key={s}
            label={s}
            color={s === status ? 'primary' : 'default'}
            variant={s === status ? 'filled' : 'outlined'}
            onClick={() => setStatus(s)}
          />
        ))}
      </Stack>
      <ScrollX>
        <Table size="small" sx={{ ...tableSx, minWidth: 760 }}>
          <TableHead>
            <TableRow>
              <TableCell>Pedido</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Produto</TableCell>
              <TableCell sortDirection={sort.by === 'date' ? sort.dir : false}>
                <TableSortLabel active={sort.by === 'date'} direction={sort.dir} onClick={() => toggle('date')}>
                  Data
                </TableSortLabel>
              </TableCell>
              <TableCell align="right" sortDirection={sort.by === 'total' ? sort.dir : false}>
                <TableSortLabel active={sort.by === 'total'} direction={sort.dir} onClick={() => toggle('total')}>
                  Total
                </TableSortLabel>
              </TableCell>
              <TableCell>Situação</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((o) => (
              <TableRow key={o.id} hover>
                <TableCell sx={{ fontWeight: 600 }}>#{o.id}</TableCell>
                <TableCell>
                  <Typography variant="subtitle2" noWrap>
                    {o.customer}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {o.document.length > 14 ? 'CNPJ' : 'CPF'} {o.document}
                  </Typography>
                </TableCell>
                <TableCell>{o.product}</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{shortDate(o.date)}</TableCell>
                <TableCell align="right">{formatBRL(o.total)}</TableCell>
                <TableCell>
                  <StatusChip label={o.status} tone={o.tone} />
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>Nenhum pedido nesta situação.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollX>
    </Panel>
  );
}
