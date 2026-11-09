// material-ui
import Skeleton from '@mui/material/Skeleton';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';

import { LoadingLabel } from './SkeletonFrame';
import useDelayed from './useDelayed';
import { skeletonCells, skeletonWidth, type SkeletonCell } from './widths';

export interface TableSkeletonRowsProps {
  /** Quantas linhas de placeholder; use o tamanho da página para a tabela não pular quando os dados chegam. */
  rows?: number;
  /** Quantidade de colunas ou o tipo de cada uma (número alinha à direita, chip é uma pílula, check é um quadrado). */
  columns: number | SkeletonCell[];
  /** Coluna de seleção (checkbox) antes das demais. */
  checkbox?: boolean;
  /** ms antes de aparecer; 0 mostra na hora. */
  delay?: number;
}

function Shape({ kind, seed }: { kind: SkeletonCell; seed: number }) {
  if (kind === 'check') return <Skeleton aria-hidden="true" variant="rounded" width={18} height={18} sx={{ mx: 'auto' }} />;
  if (kind === 'chip') return <Skeleton aria-hidden="true" variant="rounded" width={72} height={22} sx={{ borderRadius: 3 }} />;
  if (kind === 'number') return <Skeleton aria-hidden="true" width={64} sx={{ ml: 'auto' }} />;
  return <Skeleton aria-hidden="true" width={skeletonWidth(seed)} />;
}

/**
 * Linhas de placeholder para o corpo de uma tabela cujo cabeçalho já está na tela: o usuário vê as colunas reais
 * e o formato das linhas que vão chegar. Marque a `<Table>` com `aria-busy` enquanto carrega.
 */
export default function TableSkeletonRows({ rows = 5, columns, checkbox, delay }: TableSkeletonRowsProps) {
  const shown = useDelayed(true, delay);
  const cells: SkeletonCell[] = [...(checkbox ? (['check'] as const) : []), ...skeletonCells(columns)];
  if (!shown) return null;
  return (
    <>
      {Array.from({ length: rows }, (_, r) => (
        <TableRow key={r}>
          {cells.map((kind, c) => (
            <TableCell key={c} padding={kind === 'check' ? 'checkbox' : undefined} align={kind === 'number' ? 'right' : undefined}>
              {/* a primeira célula leva o aviso para o leitor de tela; o resto é só visual */}
              {r === 0 && c === 0 && <LoadingLabel />}
              <Shape kind={kind} seed={r * 7 + c} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
