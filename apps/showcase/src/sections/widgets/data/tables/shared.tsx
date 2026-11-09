// Peças comuns das tabelas: cabeçalho, estilo e datas.
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tone } from '@c3theme/ui';

export const TONES: Tone[] = ['primary', 'info', 'success', 'warning', 'danger', 'secondary'];
export const shortDate = (iso: string) => format(parseISO(iso), 'dd/MM/yyyy', { locale: ptBR });

/** Cabeçalho de tabela a partir de uma lista de colunas (`end` alinha à direita). */
export function Head({ columns }: { columns: (string | { label: string; end?: boolean })[] }) {
  return (
    <TableHead>
      <TableRow>
        {columns.map((c) => {
          const col = typeof c === 'string' ? { label: c } : c;
          return (
            <TableCell key={col.label} align={col.end ? 'right' : 'left'} sx={{ whiteSpace: 'nowrap' }}>
              {col.label}
            </TableCell>
          );
        })}
      </TableRow>
    </TableHead>
  );
}

export const tableSx = { '& td, & th': { px: 2.5, whiteSpace: 'nowrap' }, '& tbody tr:last-of-type td': { borderBottom: 0 } } as const;
