// material-ui
import Typography from '@mui/material/Typography';

// third-party
import { TickCircle } from 'iconsax-reactjs';

import { StatusChip } from '@c3theme/ui';
import { resolveAccent, type AccentSpec } from '../../accent';
import { displayValue, findOption, isNumeric, keepsTogether, recordOptions } from '../../format';
import { negativeSx } from '../../rowStyle';
import type { FieldDef, WireRecord } from '../../types';

/** Valor de um campo numa linha de lista: componente próprio, chip de enum, ícone de booleano ou texto formatado. */
export function Cell({
  field,
  row,
  component: Custom,
  locale,
  color,
  optionLabel
}: {
  field: FieldDef;
  row: WireRecord;
  component?: any;
  locale: string;
  color?: AccentSpec;
  optionLabel: (v: string) => string;
}) {
  const value = row[field.name];
  if (Custom) return <Custom field={field} value={value} record={row} />;
  if (field.type === 'enum' && value !== null && value !== undefined && value !== '') {
    const option = findOption(field, value);
    return <StatusChip tone={option?.color} color={resolveAccent(color, row)} label={optionLabel(String(value))} />;
  }
  if (field.type === 'boolean') return value ? <TickCircle size={18} variant="Bold" /> : null;
  const shown = recordOptions(field, row)?.find((o) => o.value === value)?.label ?? displayValue(field, value, locale, optionLabel);
  return (
    <Typography
      variant="body2"
      title={keepsTogether(shown) ? shown : undefined}
      sx={[
        {
          fontVariantNumeric: isNumeric(field) ? 'tabular-nums' : undefined,
          ...(keepsTogether(shown) && { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' })
        },
        negativeSx(field, value)
      ]}
    >
      {shown}
    </Typography>
  );
}
