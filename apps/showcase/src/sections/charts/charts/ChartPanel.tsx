import { ReactNode, useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

// third-party
import { Chart21, RowVertical } from 'iconsax-reactjs';

import { Panel, ScrollX } from '@c3theme/ui';

export interface ChartTable {
  columns: string[];
  rows: ReactNode[][];
}

interface ChartPanelProps {
  title: string;
  subtitle?: string;
  /** Os mesmos dados em tabela, para quem não distingue as cores ou usa leitor de tela. */
  table: ChartTable;
  /** Controles extras ao lado da troca gráfico/tabela. */
  extra?: ReactNode;
  children: ReactNode;
}

/** Painel de gráfico com a opção de ver os dados em tabela. */
export default function ChartPanel({ title, subtitle, table, extra, children }: ChartPanelProps) {
  const [view, setView] = useState<'grafico' | 'tabela'>('grafico');
  return (
    <Panel
      title={title}
      subtitle={subtitle}
      action={
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {view === 'grafico' && extra}
          <ToggleButtonGroup size="small" exclusive value={view} onChange={(_, v) => v && setView(v)} aria-label="Forma de exibição">
            <ToggleButton value="grafico" aria-label="Ver gráfico">
              <Chart21 size={16} />
            </ToggleButton>
            <ToggleButton value="tabela" aria-label="Ver tabela">
              <RowVertical size={16} />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      }
      sx={{ height: '100%' }}
    >
      {view === 'grafico' ? (
        children
      ) : (
        <ScrollX>
          <Box sx={{ maxHeight: 320, overflow: 'auto' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {table.columns.map((c, i) => (
                    <TableCell key={c} align={i === 0 ? 'left' : 'right'}>
                      {c}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {table.rows.map((r, ri) => (
                  <TableRow key={ri}>
                    {r.map((cell, ci) => (
                      <TableCell key={ci} align={ci === 0 ? 'left' : 'right'}>
                        {cell}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </ScrollX>
      )}
    </Panel>
  );
}
