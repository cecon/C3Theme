import { useIntl } from 'react-intl';

// material-ui
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { fieldLabel, useText } from '../context';
import { displayValue, findOption } from '../format';
import type { FieldDef, WireRecord } from '../types';

/** O que foi enviado ou gravado, em "Rótulo: valor", para a parte já respondida. */
export default function AgentSummary({ fields, values }: { fields: FieldDef[]; values: WireRecord }) {
  const intl = useIntl();
  const text = useText();
  const rows = fields
    .filter((f) => values[f.name] !== undefined && values[f.name] !== null && values[f.name] !== '')
    .map((f) => {
      const v = values[f.name];
      const shown =
        f.type === 'reference' && typeof v !== 'object'
          ? String(v)
          : displayValue(f, v, intl.locale, (x) => text(findOption(f, x)?.label, x));
      return [fieldLabel(f, text), shown] as const;
    });
  if (rows.length === 0) return null;
  return (
    <Stack component="dl" spacing={0.25} sx={{ m: 0 }}>
      {rows.map(([label, shown]) => (
        <Stack key={label} direction="row" spacing={1} sx={{ minWidth: 0 }}>
          <Typography component="dt" variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
            {label}:
          </Typography>
          <Typography component="dd" variant="caption" sx={{ m: 0, overflowWrap: 'anywhere' }}>
            {shown}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}
