import { Fragment, useMemo } from 'react';
import { useIntl } from 'react-intl';

// material-ui
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { evalFormula, parseFormula } from '../formulas.mjs';
import { useText } from '../context';
import { formatComputed } from '../format';
import type { SummaryLine, WireRecord } from '../types';

/** Valor de cada linha do resumo, na ordem: uma linha com `name` pode ser citada pelas de baixo. */
export function summaryValues(lines: SummaryLine[], record: WireRecord): number[] {
  const vars: Record<string, number> = {};
  return lines.map((l) => {
    const v = evalFormula(parseFormula(l.value), record, vars);
    if (l.name) vars[l.name] = v;
    return v;
  });
}

/** Resumo da seção (`summary`): rótulo à esquerda e valor à direita; a linha `total` vem depois de um traço, em destaque. */
export default function SummaryLines({ lines, record }: { lines: SummaryLine[]; record: WireRecord }) {
  const text = useText();
  const { locale } = useIntl();
  const values = useMemo(() => summaryValues(lines, record), [lines, record]);
  return (
    <Stack spacing={1} sx={{ mt: 2.5 }} aria-live="polite">
      {lines.map((l, i) => {
        const shown = formatComputed(values[i], locale, l.currency);
        const label = text(l.label);
        if (l.total)
          return (
            <Fragment key={i}>
              <Divider />
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
                <Typography variant="subtitle1">{label}</Typography>
                <Typography variant="h4" component="p" color="primary.main">
                  {shown}
                </Typography>
              </Stack>
            </Fragment>
          );
        return (
          <Stack key={i} direction="row" sx={{ justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="body2">{l.negative ? `− ${shown}` : shown}</Typography>
          </Stack>
        );
      })}
    </Stack>
  );
}
