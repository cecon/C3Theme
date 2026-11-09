import { useIntl } from 'react-intl';
import useSWR from 'swr';
import { LineChart } from '@mui/x-charts/LineChart';

// material-ui
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import { useTheme } from '@mui/material/styles';

import { useEngine, useText } from '../../context';
import {
  bothWhere,
  ChartWidget as Chart,
  fillTimeline,
  formatMeasure,
  measureField,
  measureNumber,
  periodLabel,
  periodsUntil,
  widgetWhere
} from '../../dashboard';
import type { Tone } from '../../types';
import { paletteOf } from '../../tone';
import WidgetError from './WidgetError';

const DEFAULT_TONES: Tone[] = ['neutral', 'success', 'warning', 'info', 'danger'];

/**
 * Área no tempo, uma linha suave por série (`series`, cada uma com seu filtro), com legenda. `last` corta nos últimos
 * N períodos (a escolha de "6 meses" / "12 meses" do cabeçalho).
 */
export default function AreaWidget({ widget, last }: { widget: Chart; last?: number }) {
  const { client, entities, org } = useEngine();
  const text = useText();
  const theme = useTheme();
  const { locale } = useIntl();
  const { def } = entities[widget.entity];
  const base = widgetWhere(widget, def);
  const interval = widget.interval ?? 'month';
  const series = widget.series?.length ? widget.series : [{ label: widget.title }];
  const { data, error } = useSWR(['c3-list', widget.entity, 'aggregate-series', JSON.stringify([widget, base]), org?.active], () =>
    Promise.all(
      series.map((s) =>
        client.aggregate(widget.entity, {
          measure: ('measure' in s && s.measure) || widget.measure,
          groupBy: widget.groupBy,
          interval,
          where: bothWhere(base, 'where' in s ? s.where : undefined)
        })
      )
    )
  );

  if (error) return <WidgetError error={error} />;
  if (!data) return <Skeleton variant="rounded" height={300} />;
  // todas as séries no mesmo eixo: as chaves de todas, completadas com zero
  const keys = [...new Set(data.flatMap((d) => d.map((i) => String(i.key))).filter((k) => k !== 'null'))].sort();
  const axis = fillTimeline(
    keys.map((k) => ({ key: k, value: 0 })),
    interval,
    0
  ).map((i) => String(i.key));
  // os últimos N períodos até o mais novo com dado, mesmo que os primeiros não tenham nenhum
  const shown = last && axis.length ? periodsUntil(axis[axis.length - 1], last, interval) : axis;
  const sum = measureField(def, widget.measure);
  const scale = widget.axisScale;
  // com axisScale, o eixo mostra o número dividido (80 = R$ 80 mil); sem ele, a forma curta ("40 mil")
  const tick = (v: number) => (scale ? (v / scale).toLocaleString(locale) : v.toLocaleString(locale, { notation: 'compact' }));
  const money = (v: number | null) => (v === null ? '' : formatMeasure(String(v), sum, locale));

  return (
    <Box sx={{ '& .MuiLineChart-area': { fillOpacity: 0.18 }, mx: -1 }}>
      <LineChart
        height={300}
        xAxis={[
          {
            scaleType: 'point',
            data: shown.map((k) =>
              periodLabel(k, interval, locale)
                .replace(/ de \d+$/, '')
                .replace('.', '')
            )
          }
        ]}
        yAxis={[{ width: scale ? 40 : 48, valueFormatter: tick }]}
        series={series.map((s, i) => {
          const byKey = new Map(data[i].map((it) => [String(it.key), measureNumber(it.value)]));
          const tone = ('tone' in s && s.tone) || DEFAULT_TONES[i % DEFAULT_TONES.length];
          return {
            id: `s${i}`,
            label: text(s.label),
            data: shown.map((k) => byKey.get(k) ?? 0),
            area: true,
            curve: 'natural' as const,
            showMark: false,
            color: theme.palette[paletteOf(tone, 'primary')].main,
            valueFormatter: money
          };
        })}
        grid={{ horizontal: true }}
        margin={{ left: 8, right: 16 }}
      />
    </Box>
  );
}
