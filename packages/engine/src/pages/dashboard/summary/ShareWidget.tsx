import { useIntl } from 'react-intl';

// material-ui
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { formatSummary, itemsAt, shares, type ShareWidget as Share } from '../../../summary';
import DonutChart from '../DonutChart';
import SummaryEmpty from './SummaryEmpty';

/** Participação no total (consumo por agente): ranking com a barra do % ou a rosca com a legenda. */
export default function ShareWidget({ widget, summary }: { widget: Share; summary: unknown }) {
  const { locale } = useIntl();
  const rows = shares(widget, itemsAt(summary, widget.from));
  if (rows.length === 0) return <SummaryEmpty text={widget.empty} />;
  if (widget.chart === 'donut')
    return (
      <DonutChart items={rows.map((r) => ({ label: r.label, value: r.value, shown: formatSummary(r.value, widget.format, locale) }))} />
    );
  return (
    <Stack spacing={1.75} component="ol" sx={{ listStyle: 'none', m: 0, p: 0 }}>
      {rows.map((r, i) => {
        const pct = formatSummary(r.share, 'percent', locale);
        return (
          <li key={`${r.label}-${i}`}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline' }}>
              <Typography variant="body2" sx={{ flex: 1, minWidth: 0 }} noWrap>
                {r.label}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                {formatSummary(r.value, widget.format, locale)}
              </Typography>
              <Typography variant="subtitle2" sx={{ minWidth: 56, textAlign: 'end', fontVariantNumeric: 'tabular-nums' }}>
                {pct}
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={Math.min(100, r.share)}
              sx={{ height: 4, borderRadius: 2, mt: 0.5 }}
              aria-label={`${r.label}: ${pct} do total`}
            />
          </li>
        );
      })}
    </Stack>
  );
}
