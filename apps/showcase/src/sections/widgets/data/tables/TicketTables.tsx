// Chamados recentes e em aberto.
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { Panel, ScrollX, SoftAvatar, StatusChip } from '@c3theme/ui';
import { PEOPLE, TICKETS } from '../../data';
import { Head, TONES, shortDate, tableSx } from './shared';

/** Chamados mais recentes com departamento e situação. */
export function RecentTicketsTable() {
  return (
    <Panel title="Chamados recentes" flush>
      <ScrollX>
        <Table size="small" sx={{ ...tableSx, minWidth: 520 }}>
          <Head columns={['Assunto', 'Departamento', 'Data', 'Situação']} />
          <TableBody>
            {TICKETS.map((t) => (
              <TableRow key={t.id} hover>
                <TableCell>
                  <Typography variant="subtitle2">{t.subject}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t.id}
                  </Typography>
                </TableCell>
                <TableCell>{t.department}</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{shortDate(t.date)}</TableCell>
                <TableCell>
                  <StatusChip label={t.status} tone={t.tone} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollX>
    </Panel>
  );
}

/** Chamados em aberto com o responsável. */
export function ActiveTicketsTable() {
  const active = TICKETS.filter((t) => t.status !== 'Resolvido');
  return (
    <Panel title="Chamados ativos" subtitle={`${active.length} aguardando solução`} flush>
      <ScrollX>
        <Table size="small" sx={{ ...tableSx, minWidth: 520 }}>
          <Head columns={['Responsável', 'Chamado', 'Departamento', 'Situação']} />
          <TableBody>
            {active.map((t) => {
              const p = PEOPLE[t.person];
              return (
                <TableRow key={t.id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                      <SoftAvatar size="sm" tone={TONES[t.person % TONES.length]}>
                        {p.initials}
                      </SoftAvatar>
                      <Box>
                        <Typography variant="subtitle2" noWrap>
                          {p.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {p.role}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    {t.id} · {t.subject}
                  </TableCell>
                  <TableCell>{t.department}</TableCell>
                  <TableCell>
                    <StatusChip label={t.status} tone={t.tone} />
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
