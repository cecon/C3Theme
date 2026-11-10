// Folha impressa do registro (#39, `views.form.print`): as seções escolhidas com rótulo e valor, a related inteira
// (todas as páginas, até o limite da exportação) e as colunas `blank` em branco, para preencher no papel.
import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';

// material-ui
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { branchLabel, useEngine, useText } from '../../context';
import { fetchAll } from '../../export';
import { displayValue, findOption } from '../../format';
import type { EntityDef, FieldDef, FormSection, WireRecord } from '../../types';
import { recordTitle } from '../../views';

const fieldName = (c: string | { field: string }) => (typeof c === 'string' ? c : c.field);

/** Seções que entram na folha: as escolhidas, ou as com campos ou related; component e pairing não imprimem. */
export function printSections(def: EntityDef): FormSection[] {
  const all: FormSection[] = def.views?.form?.sections ?? [{ rows: def.fields.map((f) => [f.name]) }];
  const picked = def.views?.form?.print?.sections;
  return (picked ? picked.map((i) => all[i]).filter(Boolean) : all).filter((s) => s.rows || s.related);
}

/** Busca as filhas de cada related (with_parent já vem no registro). */
function useChildren(sections: FormSection[], record: WireRecord) {
  const { client } = useEngine();
  const [rows, setRows] = useState<Record<string, WireRecord[]>>();
  useEffect(() => {
    let alive = true;
    const load = sections.flatMap((s) => (s.related ? [s.related] : []));
    Promise.all(
      load.map(async (r) => {
        if (r.save === 'with_parent') return [r.entity, (record[r.entity] as WireRecord[] | undefined) ?? []] as const;
        const where = { field: r.field, op: 'eq' as const, value: String(record.id) };
        return [r.entity, (await fetchAll(client, r.entity, { where, sort: r.sort })).rows] as const;
      })
    ).then(
      (pairs) => alive && setRows(Object.fromEntries(pairs)),
      () => alive && setRows({})
    );
    return () => {
      alive = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return rows;
}

export default function RecordPrint({ def, record, onReady }: { def: EntityDef; record: WireRecord; onReady: () => void }) {
  const { app, entities, org } = useEngine();
  const text = useText();
  const { locale } = useIntl();
  const print = def.views?.form?.print ?? {};
  const sections = printSections(def);
  const children = useChildren(sections, record);
  useEffect(() => {
    if (children) onReady();
  }, [children]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!children) return null;

  const show = (f: FieldDef, v: unknown) => displayValue(f, v, locale, (x) => text(findOption(f, x)?.label, x)) || '—';
  const blank = new Set(print.blank ?? []);
  const where = org ? branchLabel(org, org.active) : undefined;
  const title = print.title ? text(print.title) : `${text(def.label.singular)} ${recordTitle(def, record)}`.trim();
  const cell = { border: '1px solid #999', padding: '4px 6px', textAlign: 'left' as const, fontSize: 12 };

  return (
    <Box sx={{ color: '#000', bgcolor: '#fff', p: 2, fontSize: 12 }} data-testid="record-print">
      <Box sx={{ borderBottom: '2px solid #000', pb: 1, mb: 2 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
          {[app.name, where?.company, where?.branch].filter(Boolean).join(' · ')}
        </Typography>
        <Typography sx={{ fontSize: 18, fontWeight: 700 }}>{title}</Typography>
        <Typography sx={{ fontSize: 11 }}>Emitido em {new Date().toLocaleString(locale)}</Typography>
      </Box>
      {sections.map((s, i) => {
        const r = s.related;
        const child = r ? entities[r.entity]?.def : undefined;
        const names = r
          ? (r.columns ?? child?.fields.map((f) => f.name) ?? []).filter((n) => n !== r.field)
          : (s.rows ?? []).flat().map(fieldName);
        const source = child ?? def;
        const defs = names
          .map((n) => source.fields.find((f) => f.name === n))
          .filter((f): f is FieldDef => Boolean(f) && !f!.writeOnly && f!.denied !== 'hidden');
        const heading = s.title ?? child?.label.plural;
        return (
          <Box key={i} sx={{ mb: 2, breakInside: r ? undefined : 'avoid' }}>
            {heading && <Typography sx={{ fontWeight: 700, fontSize: 13, mb: 0.5 }}>{text(heading)}</Typography>}
            {r ? (
              <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr>
                    {defs.map((f) => (
                      <th key={f.name} style={cell}>
                        {text(f.label, f.name)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(children[r.entity] ?? []).map((row, k) => (
                    <tr key={String(row.id ?? k)}>
                      {defs.map((f) => (
                        <td key={f.name} style={{ ...cell, minWidth: blank.has(f.name) ? 90 : undefined }}>
                          {blank.has(f.name) ? '' : show(f, row[f.name])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 3, rowGap: 0.5 }}>
                {defs.map((f) => (
                  <Typography key={f.name} sx={{ fontSize: 12 }}>
                    <b>{text(f.label, f.name)}:</b> {show(f, record[f.name])}
                  </Typography>
                ))}
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
}
