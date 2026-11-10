import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router';

// material-ui
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { useEngine, useText } from '../../context';
import { bothWhere, formatMeasure, type HeatmapWidget as Heatmap, measureField, widgetLink, widgetWhere } from '../../dashboard';
import { dayWhere, heatmapWeeks, type HeatCell } from '../../dashboardHeatmap';
import { paletteOf } from '../../tone';
import { useAggregate } from './useAggregate';
import WidgetError from './WidgetError';

const CELL = 12;
const GAP = 3;
const SHADES = [0.22, 0.45, 0.7, 1];

/**
 * Grade de atividade do ano (#183): o `_aggregate` por dia vira uma coluna por semana e uma linha por dia da semana.
 * O título de cada dia diz a data e o valor; o clique abre a lista daquele dia.
 */
export default function HeatmapWidget({ widget }: { widget: Heatmap }) {
  const { entities } = useEngine();
  const text = useText();
  const theme = useTheme();
  const navigate = useNavigate();
  const { locale } = useIntl();
  const { def, capabilities } = entities[widget.entity];
  const group = def.fields.find((f) => f.name === widget.groupBy);
  const sum = measureField(def, widget.measure);
  const where = widgetWhere(widget, def);
  const { data, error } = useAggregate(widget.entity, { measure: widget.measure, groupBy: widget.groupBy, interval: 'day', where });

  if (error) return <WidgetError error={error} />;
  if (!data) return <Skeleton variant="rounded" height={7 * (CELL + GAP) + 24} />;
  const weeks = heatmapWeeks(data);
  const base = theme.palette[paletteOf(widget.tone ?? 'success', 'success')].main;
  const color = (level: number) => (level ? alpha(base, SHADES[level - 1]) : theme.palette.action.hover);
  const dayText = (c: HeatCell) =>
    `${new Date(`${c.day}T12:00:00`).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })}: ${formatMeasure(c.raw, sum, locale)}`;
  const open = (c: HeatCell) => {
    if (!capabilities.list || !group || (group.type !== 'date' && group.type !== 'datetime')) return;
    navigate(widgetLink({ ...widget, where: bothWhere(widget.where, dayWhere(group.name, group.type, c.day)) }));
  };
  // mês em cima da coluna onde ele começa
  const months = weeks.map((w) => {
    const first = w.find((c) => c?.day.endsWith('-01'));
    return first ? new Date(`${first.day}T12:00:00`).toLocaleDateString(locale, { month: 'short' }) : '';
  });
  const active = weeks.flat().filter((c) => c && c.value > 0).length;

  if (!active && widget.empty)
    return (
      <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
        {text(widget.empty)}
      </Typography>
    );
  return (
    <Box sx={{ overflowX: 'auto', px: 2.5, py: 2 }}>
      <Box sx={{ width: 'max-content' }}>
        <Box
          role="img"
          aria-label={`${text(widget.title)}: ${active} dias com registro`}
          sx={{
            display: 'grid',
            gridAutoFlow: 'column',
            gridTemplateRows: `16px repeat(7, ${CELL}px)`,
            gap: `${GAP}px`,
            width: 'max-content'
          }}
        >
          {/* dias da semana à esquerda: segunda, quarta e sexta (1º de fevereiro de 2026 é domingo) */}
          <Box key="wd" />
          {[0, 1, 2, 3, 4, 5, 6].map((d) => (
            <Typography key={`wd${d}`} variant="caption" color="text.secondary" sx={{ lineHeight: `${CELL}px`, pr: 0.5, fontSize: 10 }}>
              {d % 2 ? new Date(2026, 1, 1 + d).toLocaleDateString(locale, { weekday: 'short' }) : ''}
            </Typography>
          ))}
          {weeks.map((week, i) => [
            <Typography
              key={`m${i}`}
              variant="caption"
              color="text.secondary"
              sx={{ lineHeight: '16px', whiteSpace: 'nowrap', width: CELL }}
            >
              {months[i]}
            </Typography>,
            ...week.map((c, d) =>
              c ? (
                <Box
                  key={c.day}
                  title={dayText(c)}
                  data-day={c.day}
                  onClick={() => open(c)}
                  sx={{
                    width: CELL,
                    height: CELL,
                    borderRadius: '3px',
                    bgcolor: color(c.level),
                    cursor: capabilities.list ? 'pointer' : 'default'
                  }}
                />
              ) : (
                <Box key={`e${i}-${d}`} />
              )
            )
          ])}
        </Box>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', justifyContent: 'flex-end', mt: 1 }} aria-hidden>
          <Typography variant="caption" color="text.secondary">
            menos
          </Typography>
          {[0, 1, 2, 3, 4].map((l) => (
            <Box key={l} sx={{ width: CELL, height: CELL, borderRadius: '3px', bgcolor: color(l) }} />
          ))}
          <Typography variant="caption" color="text.secondary">
            mais
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}
