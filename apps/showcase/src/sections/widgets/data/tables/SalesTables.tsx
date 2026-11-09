// Produtos e receita mensal.
import { useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { Box1 } from 'iconsax-reactjs';
import { Panel, ScrollX, SoftAvatar, StatusChip } from '@c3theme/ui';
import { MONTHLY_REVENUE, PRODUCTS } from '../../data';
import { formatBRL, formatNumber } from '../../kit/format';
import { Period } from '../../kit/period';
import { PeriodSelect } from '../../kit/PeriodMenu';
import Trend from '../../kit/Trend';
import { Head, TONES, tableSx } from './shared';

/** Produtos com estoque e vendidos no período escolhido. */
export function ProductsTable() {
  const [period, setPeriod] = useState<Period>('mes');
  return (
    <Panel title="Produtos" action={<PeriodSelect value={period} onChange={setPeriod} />} flush>
      <ScrollX>
        <Table size="small" sx={{ ...tableSx, minWidth: 560 }}>
          <Head columns={['Produto', { label: 'Preço', end: true }, { label: 'Vendidos', end: true }, 'Estoque']} />
          <TableBody>
            {PRODUCTS.map((p, i) => (
              <TableRow key={p.sku} hover>
                <TableCell>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                    <SoftAvatar tone={TONES[i % TONES.length]} variant="rounded" size="sm">
                      <Box1 size={16} />
                    </SoftAvatar>
                    <Box>
                      <Typography variant="subtitle2">{p.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {p.sku}
                      </Typography>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell align="right">{formatBRL(p.price)}</TableCell>
                <TableCell align="right">{formatNumber(p.sold[period])}</TableCell>
                <TableCell>
                  <StatusChip
                    label={p.stock === 0 ? 'Esgotado' : p.stock < 20 ? `Baixo (${p.stock})` : `${p.stock} un.`}
                    tone={p.stock === 0 ? 'danger' : p.stock < 20 ? 'warning' : 'success'}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollX>
    </Panel>
  );
}

/** Receita mês a mês com a variação sobre o mês anterior. */
export function MonthlyRevenueTable() {
  return (
    <Panel title="Receita mensal" flush>
      <Table size="small" sx={tableSx}>
        <Head columns={['Mês', { label: 'Receita', end: true }, { label: 'Variação', end: true }]} />
        <TableBody>
          {MONTHLY_REVENUE.map((m) => (
            <TableRow key={m.month} hover>
              <TableCell>{m.month}</TableCell>
              <TableCell align="right">{formatBRL(m.revenue, true)}</TableCell>
              <TableCell align="right">
                <Trend value={m.change} look="chip" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Panel>
  );
}
