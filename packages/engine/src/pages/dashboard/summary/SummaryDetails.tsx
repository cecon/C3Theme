import { useIntl } from 'react-intl';

// material-ui
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { useText } from '../../../context';
import { formatSummary, pick, type SummaryDetail } from '../../../summary';

/** Rótulo e valor de cada detalhe do item, em duas colunas; o que o item não traz fica de fora. */
export default function SummaryDetails({ details, item }: { details?: SummaryDetail[]; item: Record<string, unknown> }) {
  const text = useText();
  const { locale } = useIntl();
  const rows = (details ?? [])
    .map((d) => ({
      label: text(d.label),
      value: formatSummary(pick(item, d.value), d.format, locale, d.currency ? pick(item, d.currency) : undefined)
    }))
    .filter((r) => r.value !== '');
  if (rows.length === 0) return null;
  return (
    <Box component="dl" sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 2, rowGap: 0.5, m: 0, mt: 1.5 }}>
      {rows.map((r) => (
        <Box key={r.label} sx={{ display: 'contents' }}>
          <Typography component="dt" variant="caption" color="text.secondary">
            {r.label}
          </Typography>
          <Typography component="dd" variant="caption" sx={{ m: 0, textAlign: 'end', fontVariantNumeric: 'tabular-nums' }}>
            {r.value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
