// material-ui
import Stack from '@mui/material/Stack';

import { DateField } from '@c3theme/ui';
import { useText } from '../../context';
import type { EntityDef } from '../../types';
import type { ListQuery } from './useListQuery';

/** Período da barra (`views.list.dateRange`): "Emitidas de" e "até", cada um limitando o outro no calendário. */
export default function DateRangeFilter({ def, query }: { def: EntityDef; query: ListQuery }) {
  const text = useText();
  const range = def.views?.list?.dateRange;
  const field = range && def.fields.find((f) => f.name === range.field);
  if (!range || !field) return null;
  const [fromKey, toKey] = [`f.${field.name}.de`, `f.${field.name}.ate`];
  const from = query.params.get(fromKey);
  const to = query.params.get(toKey);
  const width = { width: { xs: '100%', md: 170 } };

  return (
    <Stack direction="row" spacing={1.5}>
      <DateField
        label={`${text(range.label ?? field.label, field.name)} de`}
        size="small"
        value={from}
        max={to ?? undefined}
        onChange={(v) => query.set({ [fromKey]: v ?? undefined })}
        sx={width}
      />
      <DateField
        label="até"
        size="small"
        value={to}
        min={from ?? undefined}
        onChange={(v) => query.set({ [toKey]: v ?? undefined })}
        sx={width}
      />
    </Stack>
  );
}
