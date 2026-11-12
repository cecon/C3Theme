import { useState } from 'react';
import { useIntl } from 'react-intl';
import useSWR from 'swr';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Panel } from '@c3theme/ui';
import { useEngine, useText } from '../../context';
import {
  summaryFormat,
  summaryNumber,
  summaryPercent,
  summaryValue,
  type SummaryField,
  type SummaryObject,
  type SummarySource,
  type SummaryWidget
} from '../../summaryDashboard';
import WidgetError from './WidgetError';
import { ApiError } from '../../api';

export default function SummaryPanel({ widget, source }: { widget: SummaryWidget; source?: SummarySource }) {
  const { client, org } = useEngine();
  const text = useText();
  const { locale } = useIntl();
  const { data, error, isLoading, mutate } = useSWR(
    source ? ['c3-list', 'summary', source.path, org?.active] : null,
    () => {
      if (!client.summary) throw new Error('Cliente sem suporte a resumo.');
      return client.summary(source!.path);
    },
    { refreshInterval: source?.refreshInterval ?? 0 }
  );
  const [pending, setPending] = useState(false);
  const [actionError, setActionError] = useState<unknown>();
  const run = async (path: string) => {
    if (pending) return;
    setPending(true);
    setActionError(undefined);
    try {
      if (!client.summary) throw new Error('Cliente sem suporte a resumo.');
      await client.summary(path, 'POST');
      await mutate();
    } catch (e) {
      setActionError(e);
    } finally {
      setPending(false);
    }
  };
  const fields = (row: unknown, definitions: SummaryField[]) =>
    definitions.map((f) => (
      <Typography key={f.field} variant="body2">
        {text(f.label)}: {summaryFormat(row, f, locale)}
      </Typography>
    ));
  const progress = (row: unknown, p: { label: import('../../types').Text; value: string; limit: string }) => {
    const value = summaryPercent(summaryValue(row, p.value), summaryValue(row, p.limit));
    return (
      <Stack spacing={0.5}>
        <Typography variant="body2">
          {text(p.label)}: {Math.round(value)}%
        </Typography>
        <LinearProgress variant="determinate" value={value} aria-label={text(p.label)} />
      </Stack>
    );
  };
  let body;
  if (!source) body = <WidgetError error={new Error('Fonte de resumo ausente.')} />;
  else if (error && (data === undefined || (error instanceof ApiError && error.status === 403))) body = <WidgetError error={error} />;
  else if (isLoading || data === undefined) body = <LinearProgress aria-label={text(widget.title)} />;
  else if (widget.type === 'summary-kpi') {
    const list = widget.items ? summaryValue(data, widget.items) : [data];
    body = Array.isArray(list)
      ? list.map((row, i) => (
          <Stack key={i} spacing={1}>
            {widget.label && <Typography variant="h6">{String(summaryValue(row, widget.label) ?? '—')}</Typography>}
            <Typography variant="h3" component="p">
              {summaryNumber(summaryValue(row, widget.value))?.toLocaleString(locale) ?? '—'}
            </Typography>
            {widget.progress && progress(row, { ...widget.progress, value: widget.value })}
            {fields(row, widget.fields ?? [])}
          </Stack>
        ))
      : null;
  } else if (widget.type === 'summary-ranking') {
    const list = summaryValue(data, widget.items);
    const rows = Array.isArray(list)
      ? [...list].sort((a, b) => (summaryNumber(summaryValue(b, widget.value)) ?? 0) - (summaryNumber(summaryValue(a, widget.value)) ?? 0))
      : [];
    const total = rows.reduce((sum, row) => sum + (summaryNumber(summaryValue(row, widget.value)) ?? 0), 0);
    body = rows.slice(0, widget.limit ?? rows.length).map((row, i) => {
      const value = summaryNumber(summaryValue(row, widget.value)) ?? 0;
      const share = widget.share ? summaryPercent(summaryValue(row, widget.share), 100) : summaryPercent(value, total);
      return (
        <Stack key={i} spacing={0.5}>
          <Typography>
            {String(summaryValue(row, widget.label) ?? '—')}: {value.toLocaleString(locale)} · {Math.round(share)}%
          </Typography>
          <LinearProgress variant="determinate" value={share} aria-label={String(summaryValue(row, widget.label) ?? text(widget.title))} />
        </Stack>
      );
    });
  } else
    body = (
      <>
        {fields(data, widget.fields)}
        <ObjectState widget={widget} data={data} />
        {widget.warnings
          ?.filter((w) => summaryValue(data, w.field) === w.equals)
          .map((w, i) => (
            <Alert key={i} severity="warning">
              {text(w.message)}
            </Alert>
          ))}
        {widget.message && <Typography role="status">{String(summaryValue(data, widget.message) ?? '')}</Typography>}
        {widget.progress && progress(data, widget.progress)}
        {widget.actions?.map((a) => {
          const disabled = !!(a.disabled && summaryValue(data, a.disabled));
          const instruction = disabled && a.instruction ? summaryValue(data, a.instruction) : undefined;
          return (
            <Stack key={a.path} spacing={0.5}>
              <Button variant="outlined" disabled={pending || disabled} onClick={() => void run(a.path)}>
                {text(a.label)}
              </Button>
              {instruction != null && <Typography variant="body2">{String(instruction)}</Typography>}
            </Stack>
          );
        })}
      </>
    );
  return (
    <Panel title={text(widget.title)} sx={{ height: '100%' }}>
      <Stack spacing={2}>
        {error && data !== undefined && !(error instanceof ApiError && error.status === 403) && <WidgetError error={error} />}
        {body}
        {actionError != null && <WidgetError error={actionError} />}
      </Stack>
    </Panel>
  );
}

function ObjectState({ widget, data }: { widget: SummaryObject; data: unknown }) {
  const text = useText();
  const state = String(summaryValue(data, widget.state) ?? '');
  const entry = Object.hasOwn(widget.states, state) ? widget.states[state] : undefined;
  return entry ? (
    <>
      <Typography role="status">{text(entry.label)}</Typography>
      {entry.warning && <Alert severity="warning">{text(entry.warning)}</Alert>}
    </>
  ) : null;
}
