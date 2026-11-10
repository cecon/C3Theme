import { useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import useSWR from 'swr';

// material-ui
import Alert from '@mui/material/Alert';
import Checkbox from '@mui/material/Checkbox';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { Panel, TableSkeletonRows } from '@c3theme/ui';
import { useEngine, useText } from '../context';
import { fetchAll } from '../export';
import { displayValue, findOption } from '../format';
import { defaults, rowErrors } from '../formValues';
import FieldInput from '../widgets/FieldInput';
import type { ChildRowsProps } from './ChildRows';
import useChecklistGestures from './useChecklistGestures';
import type { FieldDef, RefValue, WireRecord } from '../types';

/** Acima disso a lista ganha uma busca. */
const SEARCH_FROM = 12;

const refId = (v: unknown) => (v && typeof v === 'object' ? (v as RefValue).id : (v as string | undefined));

/**
 * Seção `with_parent` com `display: checklist`: todos os registros da entidade de `option` (permissões, produtos)
 * com uma caixa de marcar; cada marcado é uma linha da filha. Os outros campos da filha viram colunas da matriz,
 * editáveis só na linha marcada. Agrupa por `groupBy`, com marcar todos por grupo. Nada grava antes do Salvar do pai.
 */
export default function ChildChecklist({ related, title, rows, onChange, errors, editing }: ChildRowsProps) {
  const { client, entities } = useEngine();
  const text = useText();
  const intl = useIntl();
  const [search, setSearch] = useState('');
  // opções que o "marcar todas" deixou de fora por causa do maxItems
  const [capped, setCapped] = useState(0);
  // textos da shell com chave de tradução; o defaultMessage é o português
  const t = (id: string, defaultMessage: string) => text({ id: `c3.checklist.${id}`, defaultMessage });
  const def = entities[related.entity]?.def;
  const optField = def?.fields.find((f) => f.name === related.option);
  const target = optField?.entity ? entities[optField.entity]?.def : undefined;
  const titleField = target?.titleField ?? target?.fields.find((f) => f.type === 'string')?.name;
  const groupField = target?.fields.find((f) => f.name === related.groupBy);
  const sort = [related.groupBy, titleField].filter(Boolean).join(',');
  const { data, error } = useSWR(target ? ['c3-checklist', target.name, sort] : null, () => fetchAll(client, target!.name, { sort }));

  const bindGestures = useChecklistGestures();
  const byOption = useMemo(() => new Map(rows.map((r, i) => [refId(r[related.option!]), i])), [rows, related.option]);
  if (!def || !optField || !target || !titleField) return null;

  const extras = def.fields.filter((f) => !f.readOnly && f.name !== related.field && f.name !== related.option);
  const max = related.maxItems ?? 200;
  const label = (f: FieldDef, v: unknown) => displayValue(f, v, intl.locale, (x) => text(findOption(f, x)?.label, x));
  const optionTitle = (o: WireRecord) => String(o[titleField] ?? o.id);

  const toggle = (options: WireRecord[], on: boolean) => {
    const ids = new Set(options.map((o) => o.id));
    setCapped(0);
    if (!on) return onChange(rows.filter((r) => !ids.has(refId(r[related.option!]))));
    const added = options
      .filter((o) => !byOption.has(o.id))
      .map((o) => ({ ...defaults(def), [related.option!]: { id: o.id!, title: optionTitle(o) } }));
    const next = [...rows, ...added];
    setCapped(Math.max(0, next.length - max));
    onChange(next.slice(0, max));
  };
  const setExtra = (i: number, name: string, v: unknown) => onChange(rows.map((r, j) => (j === i ? { ...r, [name]: v } : r)));

  const q = search.trim().toLowerCase();
  const shown = (data?.rows ?? [])
    .filter((o) => editing || byOption.has(o.id))
    .filter(
      (o) => !q || [optionTitle(o), groupField ? label(groupField, o[groupField.name]) : ''].some((t) => t.toLowerCase().includes(q))
    );
  const groups = new Map<string, WireRecord[]>();
  for (const o of shown) {
    const key = groupField ? label(groupField, o[groupField.name]) || '—' : '';
    groups.set(key, [...(groups.get(key) ?? []), o]);
  }
  const full = rows.length >= max;
  const gestures = bindGestures([...groups.values()].flat(), (o) => byOption.has(o.id), toggle);

  return (
    <Panel
      title={text(title ?? def.label.plural)}
      subtitle={`${rows.length} ${t('of', 'de')} ${data?.total ?? '…'} ${t('checked', 'marcadas')}`}
      flush
    >
      {errors[related.entity] && (
        <Alert severity="error" sx={{ borderRadius: 0 }}>
          {errors[related.entity]}
        </Alert>
      )}
      {editing && capped > 0 && (
        <Alert severity="warning" onClose={() => setCapped(0)} sx={{ borderRadius: 0 }}>
          {`${t('capped', 'Limite de marcadas atingido')} (${max}). ${t('cappedLeft', 'Opções que ficaram de fora:')} ${capped}.`}
        </Alert>
      )}
      {editing && (data?.total ?? 0) > SEARCH_FROM && (
        <TextField
          size="small"
          placeholder={t('search', 'Buscar')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ m: 2, width: { xs: 'calc(100% - 32px)', sm: 320 } }}
        />
      )}
      {error && <Alert severity="error">{error.message}</Alert>}
      {!data && !error && (
        <Table size="small" aria-busy="true">
          <TableBody>
            <TableSkeletonRows rows={4} columns={1 + extras.length} />
          </TableBody>
        </Table>
      )}
      {data && shown.length === 0 && (
        <Typography color="text.secondary" sx={{ px: 2.5, py: 3 }}>
          {editing ? t('notFound', 'Nada encontrado.') : t('noneChecked', 'Nenhuma marcada.')}
        </Typography>
      )}
      {shown.length > 0 && (
        <TableContainer sx={{ maxHeight: 520 }}>
          <Table size="small" stickyHeader>
            {extras.length > 0 && (
              <TableHead>
                <TableRow>
                  <TableCell>{text(optField.label, optField.name)}</TableCell>
                  {extras.map((f) => (
                    <TableCell key={f.name} align="center">
                      {text(f.label, f.name)}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
            )}
            <TableBody>
              {[...groups].flatMap(([group, options]) => {
                const count = options.filter((o) => byOption.has(o.id)).length;
                const header = group && (
                  <TableRow key={`g-${group}`}>
                    <TableCell colSpan={1 + extras.length} sx={{ bgcolor: 'action.hover', py: 0.5 }}>
                      {editing && (
                        <Checkbox
                          size="small"
                          checked={count === options.length}
                          indeterminate={count > 0 && count < options.length}
                          onChange={(e) => toggle(options, e.target.checked)}
                          slotProps={{ input: { 'aria-label': `${t('checkAll', 'Marcar todas de')} ${group}` } }}
                        />
                      )}
                      <Typography component="span" variant="subtitle2">
                        {group}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
                const items = options.map((o) => {
                  const i = byOption.get(o.id);
                  const on = i !== undefined;
                  const errs = on ? rowErrors(errors, related.entity, i) : {};
                  const msg = Object.values(errs).join(' ');
                  const box = gestures.box(o);
                  return (
                    <TableRow key={o.id} hover={editing} selected={Boolean(msg)} onPointerEnter={() => editing && gestures.enter(o)}>
                      <TableCell sx={{ pl: group ? 4 : 1, userSelect: editing ? 'none' : undefined }}>
                        <Checkbox
                          size="small"
                          checked={on}
                          disabled={!editing || (!on && full)}
                          onChange={(e) => box.onChange(e.target.checked)}
                          onClick={box.onClick}
                          onPointerDown={box.onPointerDown}
                          slotProps={{ input: { 'aria-label': optionTitle(o) } }}
                        />
                        {optionTitle(o)}
                        {msg && (
                          <Typography variant="caption" color="error" sx={{ display: 'block', pl: 5 }}>
                            {msg}
                          </Typography>
                        )}
                      </TableCell>
                      {extras.map((f) => (
                        <TableCell key={f.name} align="center" sx={{ minWidth: f.type === 'boolean' ? 0 : 160 }}>
                          {on &&
                            (f.type === 'boolean' ? (
                              <Checkbox
                                size="small"
                                checked={Boolean(rows[i][f.name])}
                                disabled={!editing}
                                onChange={(e) => setExtra(i, f.name, e.target.checked)}
                                slotProps={{ input: { 'aria-label': `${text(f.label, f.name)}: ${optionTitle(o)}` } }}
                              />
                            ) : (
                              <FieldInput field={f} value={rows[i][f.name]} onChange={(v) => setExtra(i, f.name, v)} readOnly={!editing} />
                            ))}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                });
                return header ? [header, ...items] : items;
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Panel>
  );
}
