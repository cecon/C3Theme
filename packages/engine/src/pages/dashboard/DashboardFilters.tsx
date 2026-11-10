// material-ui
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';

import useSWR from 'swr';

import { useEngine, useText } from '../../context';
import { PERIOD_LABELS, periodOptions, type DashboardFilter, type FilterValues, type Period } from '../../dashboardFilters';
import ReferenceInput from '../../widgets/ReferenceInput';
import type { RefValue } from '../../types';

/** Barra dos filtros do painel: período e registro (filial, vendedor). Muda todos os widgets que ligam o filtro. */
export default function DashboardFilters({
  filters,
  values,
  onChange
}: {
  filters: DashboardFilter[];
  values: FilterValues;
  onChange: (name: string, value: FilterValues[string]) => void;
}) {
  const text = useText();
  return (
    <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap', mb: 2.5 }}>
      {filters.map((f) => {
        const label = text(f.label, f.type === 'period' ? 'Período' : f.name);
        if (f.type === 'period')
          return (
            <TextField
              key={f.name}
              select
              size="small"
              label={label}
              value={values[f.name] ?? 'all'}
              onChange={(e) => onChange(f.name, e.target.value as Period)}
              sx={{ minWidth: 200 }}
            >
              {periodOptions(f).map((p) => (
                <MenuItem key={p} value={p}>
                  {PERIOD_LABELS[p]}
                </MenuItem>
              ))}
            </TextField>
          );
        return (
          <RefFilter
            key={f.name}
            filter={f}
            label={label}
            value={values[f.name] as RefValue | undefined}
            onChange={(v) => onChange(f.name, v ?? undefined)}
          />
        );
      })}
    </Stack>
  );
}

/**
 * Filtro de registro. Link montado à mão (só `f.<nome>`, sem `ft.<nome>`) não traz o título: lê o registro para o
 * campo não mostrar o id nem "sem acesso".
 */
function RefFilter({
  filter,
  label,
  value,
  onChange
}: {
  filter: Extract<DashboardFilter, { type: 'reference' }>;
  label: string;
  value: RefValue | undefined;
  onChange: (v: RefValue | null) => void;
}) {
  const { client, entities } = useEngine();
  const target = entities[filter.entity]?.def;
  const missing = value && !value.title ? value.id : null;
  const { data } = useSWR(missing ? ['c3-dashboard-ref', filter.entity, missing] : null, () => client.get(filter.entity, missing!));
  const titleField = target?.titleField;
  const shown = value && !value.title && data && titleField ? { id: value.id, title: String(data[titleField] ?? value.id) } : value;
  return (
    <Stack sx={{ minWidth: 260 }}>
      <ReferenceInput
        field={{ name: filter.name, type: 'reference', entity: filter.entity, label: filter.label ?? filter.name }}
        label={label}
        size="small"
        noCreate
        value={shown ?? null}
        onChange={(v) => onChange((v as RefValue | null) ?? null)}
      />
    </Stack>
  );
}
