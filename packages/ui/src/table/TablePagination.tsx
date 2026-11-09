import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';

// material-ui
import MenuItem from '@mui/material/MenuItem';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import type { Theme } from '@mui/material/styles';

// third-party
import type { Table } from '@tanstack/react-table';

import { useUiText } from '../i18n';

export interface TablePaginationProps<T> {
  table: Table<T>;
  pageSizes?: number[];
  /** Mostra o campo "Ir para a página". */
  jumpTo?: boolean;
  /** Borda em cima (rodapé) ou embaixo (paginação no topo). */
  position?: 'top' | 'bottom';
}

/**
 * Paginação: linhas por página, "1–25 de 1.234" e páginas numeradas. O total vem de `table.getRowCount()`: no
 * modo servidor é o `rowCount` (total do backend); no cliente, as linhas depois dos filtros.
 */
export default function TablePagination<T>({
  table,
  pageSizes = [10, 25, 50, 100],
  jumpTo = true,
  position = 'bottom'
}: TablePaginationProps<T>) {
  const t = useUiText();
  const { locale } = useIntl();
  const phone = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));
  const { pageIndex, pageSize } = table.getState().pagination;
  const total = table.getRowCount();
  const pages = Math.max(1, table.getPageCount());
  const from = total === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min(total, (pageIndex + 1) * pageSize);
  const [target, setTarget] = useState('');
  const n = (v: number) => v.toLocaleString(locale);
  // tamanho inicial fora da lista ainda aparece no seletor
  const sizes = pageSizes.includes(pageSize) ? pageSizes : [...pageSizes, pageSize].sort((a, b) => a - b);

  // filtros podem deixar a página atual além da última: volta para a última válida
  useEffect(() => {
    if (pageIndex > 0 && pageIndex >= pages) table.setPageIndex(pages - 1);
  }, [pageIndex, pages, table]);

  const go = () => {
    const page = Number(target);
    if (Number.isInteger(page) && page >= 1 && page <= pages) table.setPageIndex(page - 1);
    setTarget('');
  };

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      sx={{
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1.5,
        px: 2.5,
        py: 1.5,
        ...(position === 'bottom' ? { borderTop: 1 } : { borderBottom: 1 }),
        borderColor: 'divider'
      }}
    >
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {t('c3.table.rowsPerPage')}
          </Typography>
          <TextField
            select
            size="small"
            value={pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            slotProps={{ htmlInput: { 'aria-label': t('c3.table.rowsPerPage') } }}
            sx={{ '& .MuiSelect-select': { py: 0.5 } }}
          >
            {sizes.map((size) => (
              <MenuItem key={size} value={size}>
                {size}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {t('c3.table.range', { from: n(from), to: n(to), total: n(total) })}
        </Typography>
      </Stack>

      <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Pagination
          count={pages}
          page={Math.min(pageIndex + 1, pages)}
          onChange={(_, p) => table.setPageIndex(p - 1)}
          color="primary"
          shape="rounded"
          size={phone ? 'small' : 'medium'}
          siblingCount={phone ? 0 : 1}
          showFirstButton={!phone}
          showLastButton={!phone}
        />
        {jumpTo && !phone && (
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {t('c3.table.jumpTo')}
            </Typography>
            <TextField
              size="small"
              type="number"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && go()}
              onBlur={() => target && go()}
              placeholder={String(pageIndex + 1)}
              slotProps={{ htmlInput: { min: 1, max: pages, 'aria-label': t('c3.table.jumpToPage') } }}
              sx={{ width: 72, '& input': { py: 0.75 } }}
            />
          </Stack>
        )}
      </Stack>
    </Stack>
  );
}
