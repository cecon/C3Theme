import { useIntl } from 'react-intl';
import { Link } from 'react-router';

// material-ui
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { SoftAvatar } from '@c3theme/ui';
import { iconByName, useEngine, useText } from '../../context';
import { bothWhere, formatMeasure, KpiWidget as Kpi, measureField, measureNumber, share, widgetLink, widgetWhere } from '../../dashboard';
import { paletteOf } from '../../tone';
import { useAggregate } from './useAggregate';
import KpiCompare from './KpiCompare';
import WidgetError from './WidgetError';

/**
 * Indicador: um número só, que leva à lista com o mesmo recorte. Com `icon`, vira o cartão completo: ícone na cor,
 * título e valor ao lado, a contagem ("25 faturas") e a barra de `progress` ("50% recebido").
 */
export default function KpiWidget({ widget }: { widget: Kpi }) {
  const { entities, icons } = useEngine();
  const text = useText();
  const { locale } = useIntl();
  const { def } = entities[widget.entity];
  const where = widgetWhere(widget, def);
  const { data, error } = useAggregate(widget.entity, { measure: widget.measure, where });
  const p = widget.progress;
  // a contagem e a barra pedem outras somas: sem elas, nenhuma chamada a mais
  const count = useAggregate(widget.entity, widget.count ? { where } : null);
  const part = useAggregate(widget.entity, p ? { measure: widget.measure, where: bothWhere(where, p.part) } : null);
  const whole = useAggregate(widget.entity, p?.whole ? { measure: widget.measure, where: p.whole } : null);
  const title = text(widget.title);

  if (error) return <WidgetError error={error} />;
  const value = data ? formatMeasure(data[0]?.value ?? 0, measureField(def, widget.measure), locale) : undefined;
  const Icon = iconByName(widget.icon, icons);
  if (!Icon)
    return (
      <>
        <Typography variant="body1" color="text.secondary">
          {title}
        </Typography>
        {value === undefined ? (
          <Skeleton variant="text" width="50%" sx={{ fontSize: '2.25rem' }} />
        ) : (
          <Link to={widgetLink(widget)} style={{ color: 'inherit', textDecoration: 'none' }} aria-label={`${value}: abrir a lista`}>
            <Typography variant="h2" component="p" sx={{ fontVariantNumeric: 'tabular-nums' }}>
              {value}
            </Typography>
          </Link>
        )}
        {widget.compare && data && <KpiCompare widget={widget} value={data[0]?.value ?? 0} />}
      </>
    );

  const n = count.data ? measureNumber(count.data[0]?.value ?? 0) : undefined;
  const base = p?.whole ? whole.data : data;
  const pct = part.data && base ? Math.round(share(measureNumber(part.data[0]?.value ?? 0), measureNumber(base[0]?.value ?? 0))) : 0;
  const tone = widget.tone ?? 'neutral';
  const label = p ? text(p.label) : '';
  return (
    <Link to={widgetLink(widget)} style={{ color: 'inherit', textDecoration: 'none', display: 'block' }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <SoftAvatar tone={tone === 'neutral' ? 'primary' : tone} variant="rounded">
          <Icon size={20} />
        </SoftAvatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
          <Typography variant="h4" component="p" noWrap sx={{ fontVariantNumeric: 'tabular-nums' }}>
            {value ?? <Skeleton width={120} />}
          </Typography>
          {widget.compare && data && <KpiCompare widget={widget} value={data[0]?.value ?? 0} />}
        </Box>
      </Stack>
      {(widget.count || p) && (
        <Stack direction="row" sx={{ justifyContent: 'space-between', mt: 2, mb: 0.75 }}>
          <Typography variant="caption" color="text.secondary">
            {n !== undefined && `${n} ${text(n === 1 ? def.label.singular : def.label.plural).toLowerCase()}`}
          </Typography>
          {p && (
            <Typography variant="caption" color="text.secondary">
              {pct}% {label}
            </Typography>
          )}
        </Stack>
      )}
      {p && (
        <LinearProgress
          variant="determinate"
          value={pct}
          color={paletteOf(tone, 'primary')}
          sx={{ height: 6, borderRadius: 3 }}
          aria-label={`${title}: ${pct}% ${label}`}
        />
      )}
    </Link>
  );
}
