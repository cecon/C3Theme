import { useIntl } from 'react-intl';

// material-ui
import Typography from '@mui/material/Typography';

// third-party
import { ArrowDown, ArrowUp } from 'iconsax-reactjs';

import { useEngine, useText } from '../../context';
import { measureNumber, type KpiWidget as Kpi } from '../../dashboard';
import { variation } from '../../dashboardList';
import { useAggregate } from './useAggregate';

/**
 * Variação do KPI sobre outro recorte (`compare`, #64): "▲ 12,5% vs. em 30 dias", verde quando é bom e vermelho quando
 * é ruim (`invert`: subir é ruim, como numa despesa). O recorte é o preset e o where do `compare`, no lugar dos do widget.
 */
const tone = (v: { pct: number; good: boolean }, shade: 'dark' | 'light') =>
  v.pct === 0 ? 'text.secondary' : `${v.good ? 'success' : 'error'}.${shade}`;

export default function KpiCompare({ widget, value }: { widget: Kpi; value: number | string | undefined }) {
  const { entities } = useEngine();
  const text = useText();
  const { locale } = useIntl();
  const c = widget.compare!;
  const preset = entities[widget.entity].def.views?.list?.presets?.find((p) => p.id === c.preset)?.where;
  const where = preset && c.where ? { and: [preset, c.where] } : (preset ?? c.where);
  const { data } = useAggregate(widget.entity, { measure: widget.measure, where });
  if (value === undefined || !data) return null;
  const v = variation(measureNumber(value), measureNumber(data[0]?.value ?? 0), c.invert);
  if (!v) return null;
  const Arrow = v.up ? ArrowUp : ArrowDown;
  const pct = Math.abs(v.pct).toLocaleString(locale, { maximumFractionDigits: 1 });
  const label = `${v.pct === 0 ? '' : v.up ? 'Subiu ' : 'Caiu '}${pct}% em relação a ${text(c.label)}`;
  return (
    <Typography
      variant="caption"
      aria-label={label}
      sx={[
        { display: 'inline-flex', alignItems: 'center', gap: 0.5, mt: 0.5, fontWeight: 600, color: tone(v, 'dark') },
        // o tom escuro some no fundo escuro: lá vale o claro
        (theme) => theme.applyStyles('dark', { color: tone(v, 'light') })
      ]}
    >
      {v.pct !== 0 && <Arrow size={14} aria-hidden />}
      {`${pct}%`}
      <Typography component="span" variant="caption" color="text.secondary">
        {`vs. ${text(c.label)}`}
      </Typography>
    </Typography>
  );
}
