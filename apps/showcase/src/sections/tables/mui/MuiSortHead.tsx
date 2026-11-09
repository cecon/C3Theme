// material-ui
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';

import { Sentido } from './shared';

export interface ColunaMui<T> {
  chave: keyof T & string;
  rotulo: string;
  align?: 'left' | 'right' | 'center';
  ordenavel?: boolean;
}

interface MuiSortHeadProps<T> {
  colunas: ColunaMui<T>[];
  ordem: { chave: keyof T & string; sentido: Sentido };
  onOrdenar: (chave: keyof T & string) => void;
  /** Com seleção: total visível e quantas estão marcadas. */
  selecao?: { total: number; marcadas: number; onAlternarTodas: () => void };
}

/** Cabeçalho das tabelas MUI com ordenação por clique e caixa "selecionar todas". */
export default function MuiSortHead<T>({ colunas, ordem, onOrdenar, selecao }: MuiSortHeadProps<T>) {
  return (
    <TableHead>
      <TableRow>
        {selecao && (
          <TableCell padding="checkbox" sx={{ pl: 1.5 }}>
            <Checkbox
              size="small"
              checked={selecao.total > 0 && selecao.marcadas === selecao.total}
              indeterminate={selecao.marcadas > 0 && selecao.marcadas < selecao.total}
              onChange={selecao.onAlternarTodas}
              slotProps={{ input: { 'aria-label': 'Selecionar todas as linhas' } }}
            />
          </TableCell>
        )}
        {colunas.map((c) => {
          const ativa = ordem.chave === c.chave;
          return (
            <TableCell key={c.chave} align={c.align} sortDirection={ativa ? ordem.sentido : false}>
              {c.ordenavel === false ? (
                c.rotulo
              ) : (
                <TableSortLabel active={ativa} direction={ativa ? ordem.sentido : 'asc'} onClick={() => onOrdenar(c.chave)}>
                  {c.rotulo}
                </TableSortLabel>
              )}
            </TableCell>
          );
        })}
      </TableRow>
    </TableHead>
  );
}

/** Próxima ordem ao clicar num cabeçalho: mesma coluna inverte, outra começa crescente. */
export function proximaOrdem<K extends string>(atual: { chave: K; sentido: Sentido }, chave: K) {
  return { chave, sentido: atual.chave === chave && atual.sentido === 'asc' ? ('desc' as const) : ('asc' as const) };
}
