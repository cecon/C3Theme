import { useIntl } from 'react-intl';

// material-ui
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { formatSummary, itemsAt, meterLevel, numberAt, pick, type MeterWidget as Meter } from '../../../summary';
import { paletteOf } from '../../../tone';
import SummaryDetails from './SummaryDetails';
import SummaryEmpty from './SummaryEmpty';

/**
 * Uso com limite, um bloco por item (provedor): nome, "valor de limite", a barra com o % e os detalhes. A barra fica
 * amarela a partir de 80% e vermelha acima de 100%; sem limite no item, só o valor.
 */
export default function MeterWidget({ widget, summary }: { widget: Meter; summary: unknown }) {
  const { locale } = useIntl();
  const items = itemsAt(summary, widget.from);
  if (items.length === 0) return <SummaryEmpty text={widget.empty} />;
  return (
    <Stack spacing={2.5}>
      {items.map((item, i) => {
        const label = String(pick(item, widget.label) ?? '');
        const value = numberAt(item, widget.value) ?? 0;
        const limit = numberAt(item, widget.limit);
        const shown = formatSummary(value, widget.format, locale);
        const level = limit !== undefined ? meterLevel(value, limit) : undefined;
        const pct = level ? Math.round(level.pct) : 0;
        return (
          <div key={`${label}-${i}`}>
            <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Typography variant="subtitle2">{label}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                {limit === undefined ? shown : `${shown} de ${formatSummary(limit, widget.format, locale)} · ${pct}%`}
              </Typography>
            </Stack>
            {level && (
              <LinearProgress
                variant="determinate"
                value={Math.min(100, level.pct)}
                color={paletteOf(level.tone, 'primary')}
                sx={{ height: 6, borderRadius: 3, mt: 0.75 }}
                aria-label={`${label}: ${pct}% do limite`}
              />
            )}
            <SummaryDetails details={widget.details} item={item} />
          </div>
        );
      })}
    </Stack>
  );
}
