import { useIntl } from 'react-intl';
import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';

// material-ui
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

import { useEngine, useText } from '../../context';
import {
  AggregateItem,
  ChartWidget as Chart,
  chartKind,
  fillTimeline,
  formatMeasure,
  isDateField,
  measureField,
  measureNumber,
  orderGroups,
  periodLabel,
  widgetWhere
} from '../../dashboard';
import { findOption } from '../../format';
import type { FieldDef } from '../../types';
import ChartTable from './ChartTable';
import DonutChart from './DonutChart';
import { useAggregate } from './useAggregate';
import WidgetError from './WidgetError';

const BAR_ROW = 36;

/** Gráfico de um campo agrupado: barras deitadas por categoria, linha no tempo. Uma série só, sem legenda. */
export default function ChartWidget({ widget, table }: { widget: Chart; table: boolean }) {
  const { entities } = useEngine();
  const text = useText();
  const theme = useTheme();
  const { locale } = useIntl();
  const { def } = entities[widget.entity];
  const group = def.fields.find((f) => f.name === widget.groupBy);
  const sum = measureField(def, widget.measure);
  const interval = widget.interval ?? 'month';
  const dated = isDateField(group);
  const { data, error } = useAggregate(widget.entity, {
    measure: widget.measure,
    groupBy: widget.groupBy,
    interval: dated ? interval : undefined,
    where: widgetWhere(widget, def)
  });

  if (error) return <WidgetError error={error} />;
  if (!data) return <Skeleton variant="rounded" height={200} />;
  const zero = sum?.type === 'decimal' ? '0' : 0;
  const items = dated ? fillTimeline(data, interval, zero) : orderGroups(data, group);
  if (!items.length)
    return (
      <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
        {widget.empty ? text(widget.empty) : 'Nenhum registro.'}
      </Typography>
    );

  const label = (i: AggregateItem) => groupLabel(group, i, interval, locale, (v) => text(findOption(group, v)?.label, v));
  const labels = items.map(label);
  const values = items.map((i) => measureNumber(i.value));
  const shown = (v: number | null) => (v === null ? '' : formatMeasure(String(v), sum, locale));
  const compact = (v: number) => v.toLocaleString(locale, { notation: 'compact' });
  const color = theme.palette.primary.main;

  if (table) return <ChartTable labels={labels} values={items.map((i) => formatMeasure(i.value, sum, locale))} />;
  const kind = chartKind(widget, group);
  if (kind === 'donut')
    return (
      <DonutChart
        items={items.map((i, n) => ({
          label: labels[n],
          value: values[n],
          shown: formatMeasure(i.value, sum, locale),
          tone: group?.type === 'enum' ? findOption(group, i.key as string)?.color : undefined
        }))}
      />
    );
  if (kind === 'line')
    return (
      <LineChart
        height={240}
        hideLegend
        grid={{ horizontal: true }}
        margin={{ top: 16, left: 8, right: 40 }}
        xAxis={[{ scaleType: 'point', data: labels }]}
        yAxis={[{ min: 0, valueFormatter: compact, width: 48 }]}
        series={[{ data: values, color, curve: 'linear', showMark: items.length <= 24, valueFormatter: shown }]}
      />
    );
  return (
    <BarChart
      layout="horizontal"
      height={Math.max(200, items.length * BAR_ROW + 48)}
      hideLegend
      borderRadius={4}
      grid={{ vertical: true }}
      margin={{ top: 8, left: 8, right: 40 }}
      yAxis={[{ scaleType: 'band', data: labels, width: 128, categoryGapRatio: 0.5 }]}
      xAxis={[{ min: 0, valueFormatter: compact }]}
      series={[{ data: values, color, valueFormatter: shown }]}
    />
  );
}

/** Texto do grupo: período da data, título do reference, rótulo da opção, Sim/Não. */
function groupLabel(
  f: FieldDef | undefined,
  i: AggregateItem,
  interval: Parameters<typeof periodLabel>[1],
  locale: string,
  option: (v: string) => string
) {
  if (i.key === null) return f?.type === 'reference' ? 'Sem vínculo' : 'Sem valor';
  if (isDateField(f)) return periodLabel(String(i.key), interval, locale);
  if (f?.type === 'reference') return i.title ?? 'Sem acesso';
  if (f?.type === 'boolean') return i.key ? 'Sim' : 'Não';
  return option(String(i.key));
}
