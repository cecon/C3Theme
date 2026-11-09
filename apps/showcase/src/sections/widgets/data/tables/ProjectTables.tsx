// Vendas por aplicativo, projetos e últimas vendas.
import AvatarGroup from '@mui/material/AvatarGroup';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { SparkLineChart } from '@mui/x-charts/SparkLineChart';
import { Panel, ScrollX, SoftAvatar, StatusChip } from '@c3theme/ui';
import { APP_SALES, LAST_SALES, PEOPLE, PROJECTS } from '../../data';
import { formatBRL, formatNumber } from '../../kit/format';
import { useChartColors } from '../../kit/useChartColors';
import { Head, TONES, shortDate, tableSx } from './shared';

/** Vendas por aplicativo com tendência em mini-gráfico. */
export function AppSalesTable() {
  const colors = useChartColors();
  return (
    <Panel title="Vendas por aplicativo" flush>
      <ScrollX>
        <Table size="small" sx={{ ...tableSx, minWidth: 560 }}>
          <Head
            columns={[
              'Aplicativo',
              'Tendência',
              { label: 'Vendas', end: true },
              { label: 'Preço médio', end: true },
              { label: 'Total', end: true }
            ]}
          />
          <TableBody>
            {APP_SALES.map((a, i) => (
              <TableRow key={a.name} hover>
                <TableCell>
                  <Typography variant="subtitle2">{a.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {a.platform}
                  </Typography>
                </TableCell>
                <TableCell sx={{ width: 120 }}>
                  <SparkLineChart data={a.trend} height={32} width={100} curve="natural" color={i % 2 ? colors.success : colors.primary} />
                </TableCell>
                <TableCell align="right">{formatNumber(a.sales)}</TableCell>
                <TableCell align="right">{formatBRL(a.avg)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  {formatBRL(a.sales * a.avg, true)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollX>
    </Panel>
  );
}

/** Projetos com equipe, prazo e progresso. */
export function ProjectsTable() {
  return (
    <Panel title="Projetos" flush>
      <ScrollX>
        <Table size="small" sx={{ ...tableSx, minWidth: 600 }}>
          <Head columns={['Projeto', 'Equipe', 'Prazo', 'Progresso', 'Situação']} />
          <TableBody>
            {PROJECTS.map((p) => (
              <TableRow key={p.name} hover>
                <TableCell>
                  <Typography variant="subtitle2">{p.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {p.client}
                  </Typography>
                </TableCell>
                <TableCell>
                  <AvatarGroup max={3} sx={{ justifyContent: 'flex-end', '& .MuiAvatar-root': { width: 28, height: 28, fontSize: 11 } }}>
                    {p.team.map((idx) => (
                      <SoftAvatar key={idx} size="sm" tone={TONES[idx % TONES.length]} look="filled" title={PEOPLE[idx].name}>
                        {PEOPLE[idx].initials}
                      </SoftAvatar>
                    ))}
                  </AvatarGroup>
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{shortDate(p.due)}</TableCell>
                <TableCell sx={{ minWidth: 120 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <LinearProgress
                      variant="determinate"
                      value={p.progress}
                      color={p.tone === 'danger' ? 'error' : 'primary'}
                      sx={{ flex: 1, height: 6, borderRadius: 3 }}
                      aria-label={`Progresso de ${p.name}`}
                    />
                    <Typography variant="caption">{p.progress}%</Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <StatusChip label={p.status} tone={p.tone} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollX>
    </Panel>
  );
}

/** Resumo das últimas vendas com totais no topo. */
export function LastSalesTable() {
  const total = LAST_SALES.reduce((s, r) => s + r.total, 0);
  const units = LAST_SALES.reduce((s, r) => s + r.qty, 0);
  return (
    <Panel title="Últimas vendas" flush>
      <Stack direction="row" sx={{ borderBottom: 1, borderColor: 'divider' }}>
        {[
          { label: 'Faturado', value: formatBRL(total, true) },
          { label: 'Unidades', value: formatNumber(units) },
          { label: 'Ticket médio', value: formatBRL(total / LAST_SALES.length, true) }
        ].map((s, i) => (
          <Box key={s.label} sx={{ flex: 1, p: 2, textAlign: 'center', borderInlineStart: i ? 1 : 0, borderColor: 'divider' }}>
            <Typography variant="h5" component="p">
              {s.value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {s.label}
            </Typography>
          </Box>
        ))}
      </Stack>
      <ScrollX>
        <Table size="small" sx={{ ...tableSx, minWidth: 480 }}>
          <Head columns={['Produto', 'Cliente', { label: 'Qtd.', end: true }, { label: 'Total', end: true }]} />
          <TableBody>
            {LAST_SALES.map((s) => (
              <TableRow key={s.product + s.customer} hover>
                <TableCell>{s.product}</TableCell>
                <TableCell>{s.customer}</TableCell>
                <TableCell align="right">{s.qty}</TableCell>
                <TableCell align="right">{formatBRL(s.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollX>
    </Panel>
  );
}
