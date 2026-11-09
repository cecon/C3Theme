import { useMemo } from 'react';
import { useIntl } from 'react-intl';

// material-ui
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';

// third-party
import type { Column, Table } from '@tanstack/react-table';

import { useUiText } from '../i18n';
import DebouncedField from './DebouncedField';
import { colLabel, colMeta } from './meta';

type Range = [number | undefined, number | undefined];

const field = { size: 'small', fullWidth: true } as const;
const font = {
  '& .MuiInputBase-input': { fontSize: '0.8125rem', py: 0.75 },
  // sem as setinhas do campo numérico, que comem espaço
  '& input[type=number]': { MozAppearance: 'textfield' },
  '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': { WebkitAppearance: 'none', m: 0 }
};

function toNumber(text: string) {
  if (text.trim() === '') return undefined;
  const n = Number(text.replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
}

/** Filtro de uma coluna conforme `meta.filterVariant`: texto, faixa numérica (mín/máx) ou lista de valores. */
export default function ColumnFilter<T>({ column, table }: { column: Column<T, unknown>; table: Table<T> }) {
  const t = useUiText();
  const { locale } = useIntl();
  const { filterVariant = 'text' } = colMeta(column);
  // filtrar sempre volta para a primeira página
  const apply = (value: unknown) => {
    column.setFilterValue(value);
    table.setPageIndex(0);
  };
  const label = colLabel(column);
  const value = column.getFilterValue();
  const unique = column.getFacetedUniqueValues();
  const minMax = column.getFacetedMinMaxValues();

  const options = useMemo(
    () =>
      filterVariant === 'select'
        ? Array.from(unique.keys())
            .map((v) => String(v))
            .sort((a, b) => a.localeCompare(b, locale))
        : [],
    [filterVariant, unique, locale]
  );

  if (filterVariant === 'range') {
    const range = (value as Range | undefined) ?? [undefined, undefined];
    const set = (index: 0 | 1, text: string) =>
      apply((before: Range | undefined) => {
        const next: Range = [...(before ?? [undefined, undefined])];
        next[index] = toNumber(text);
        return next[0] === undefined && next[1] === undefined ? undefined : next;
      });
    return (
      <Stack direction="row" spacing={0.5} sx={{ minWidth: 130 }}>
        <DebouncedField
          {...field}
          sx={font}
          type="number"
          value={range[0]?.toString() ?? ''}
          onChange={(text) => set(0, text)}
          placeholder={t('c3.table.min')}
          title={minMax ? String(minMax[0]) : undefined}
          slotProps={{ htmlInput: { 'aria-label': t('c3.table.minOf', { label }) } }}
        />
        <DebouncedField
          {...field}
          sx={font}
          type="number"
          value={range[1]?.toString() ?? ''}
          onChange={(text) => set(1, text)}
          placeholder={t('c3.table.max')}
          title={minMax ? String(minMax[1]) : undefined}
          slotProps={{ htmlInput: { 'aria-label': t('c3.table.maxOf', { label }) } }}
        />
      </Stack>
    );
  }

  if (filterVariant === 'select') {
    return (
      <TextField
        {...field}
        select
        sx={[font, { minWidth: 120 }]}
        value={(value as string | undefined) ?? ''}
        onChange={(e) => apply(e.target.value || undefined)}
        slotProps={{ htmlInput: { 'aria-label': t('c3.table.filterOf', { label }) }, select: { displayEmpty: true } }}
      >
        <MenuItem value="">{t('c3.table.all')}</MenuItem>
        {options.map((o) => (
          <MenuItem key={o} value={o}>
            {o}
          </MenuItem>
        ))}
      </TextField>
    );
  }

  return (
    <DebouncedField
      {...field}
      sx={[font, { minWidth: 110 }]}
      value={(value as string | undefined) ?? ''}
      onChange={(text) => apply(text || undefined)}
      placeholder={t('c3.table.filter')}
      slotProps={{ htmlInput: { 'aria-label': t('c3.table.filterOf', { label }) } }}
    />
  );
}
