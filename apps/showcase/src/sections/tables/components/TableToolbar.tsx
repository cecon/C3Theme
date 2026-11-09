import { ReactNode } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { Row, Table } from '@tanstack/react-table';
import { SearchNormal1 } from 'iconsax-reactjs';

import { softColors } from '@c3theme/ui';
import { DebouncedField } from '@c3theme/ui/table';
import ColumnVisibilityMenu from './ColumnVisibilityMenu';
import CsvButton from './CsvButton';
import { exportarCsv } from './meta';
import { formatarNumero } from '../format';

interface TableToolbarProps<T> {
  table: Table<T>;
  /** Campo de busca ligado ao filtro global. */
  busca?: boolean;
  placeholder?: string;
  /** Botão de mostrar/ocultar colunas. */
  colunas?: boolean;
  /** Nome do arquivo CSV; sem ele, não há botão de exportar. */
  csv?: string;
  /** Controles extras à esquerda, depois da busca (filtros rápidos, chaves). */
  children?: ReactNode;
  /** Ações extras à direita. */
  acoes?: ReactNode;
  /** Ações em lote, mostradas no lugar da barra quando há linhas selecionadas. */
  acoesEmLote?: (selecionadas: Row<T>[]) => ReactNode;
}

/** Barra de ferramentas das tabelas de dados: busca, filtros rápidos, colunas, CSV e ações em lote. */
export default function TableToolbar<T>({
  table,
  busca = true,
  placeholder,
  colunas,
  csv,
  children,
  acoes,
  acoesEmLote
}: TableToolbarProps<T>) {
  const selecionadas = acoesEmLote ? table.getSelectedRowModel().flatRows : [];
  const total = table.getCoreRowModel().flatRows.length;

  if (acoesEmLote && selecionadas.length > 0) {
    return (
      <Stack
        direction="row"
        sx={(theme) => ({
          ...softColors(theme, 'primary'),
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1,
          px: 2.5,
          py: 1.25,
          minHeight: 64
        })}
        role="region"
        aria-label="Ações em lote"
      >
        <Typography variant="subtitle1" sx={{ color: 'inherit' }}>
          {selecionadas.length === 1 ? '1 selecionada' : `${selecionadas.length} selecionadas`}
        </Typography>
        <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          {acoesEmLote(selecionadas)}
          {csv && <CsvButton onExport={() => exportarCsv(table, `${csv}-selecionadas`, selecionadas)} />}
          <Button color="inherit" onClick={() => table.resetRowSelection()}>
            Limpar seleção
          </Button>
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between', gap: 1.5, px: 2.5, py: 1.5, minHeight: 64 }}
    >
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5, flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
        {busca && (
          <DebouncedField
            size="small"
            value={String(table.getState().globalFilter ?? '')}
            onChange={(v) => {
              table.setGlobalFilter(v);
              table.setPageIndex(0);
            }}
            placeholder={placeholder ?? `Buscar em ${formatarNumero(total)} registros…`}
            sx={{ width: { xs: '100%', sm: 280 } }}
            slotProps={{
              htmlInput: { 'aria-label': 'Buscar na tabela' },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchNormal1 size={16} />
                  </InputAdornment>
                )
              }
            }}
          />
        )}
        {children}
      </Stack>
      {(colunas || csv || acoes) && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
          {acoes}
          {colunas && <ColumnVisibilityMenu table={table} />}
          {csv && <CsvButton onExport={() => exportarCsv(table, csv)} />}
        </Box>
      )}
    </Stack>
  );
}
