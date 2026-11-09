// Tabela de produtos.
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import { flexRender, Table as TanTable } from '@tanstack/react-table';
import { ScrollX } from '@c3theme/ui';
import { Product } from '../data';

/** Tabela de produtos com ordenação pelos cabeçalhos e seleção. */
export function ProductTable({ table }: { table: TanTable<Product> }) {
  const colCount = table.getAllLeafColumns().length;
  return (
    <ScrollX>
      <Table sx={{ minWidth: 900 }}>
        <TableHead>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((h) => (
                <TableCell key={h.id} padding={h.id === 'selecao' ? 'checkbox' : 'normal'} sortDirection={h.column.getIsSorted() || false}>
                  {h.column.getCanSort() ? (
                    <TableSortLabel
                      active={!!h.column.getIsSorted()}
                      direction={h.column.getIsSorted() || 'asc'}
                      onClick={h.column.getToggleSortingHandler()}
                    >
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </TableSortLabel>
                  ) : (
                    flexRender(h.column.columnDef.header, h.getContext())
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableHead>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} hover selected={row.getIsSelected()}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} padding={cell.column.id === 'selecao' ? 'checkbox' : 'normal'}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
          {table.getRowModel().rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={colCount} sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
                Nenhum produto encontrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </ScrollX>
  );
}
