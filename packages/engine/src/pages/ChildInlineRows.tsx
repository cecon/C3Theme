import { useMemo } from 'react';
import { useIntl } from 'react-intl';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { Add } from 'iconsax-reactjs';

import { evalFormula, parseFormula } from '../formulas.mjs';
import { useText } from '../context';
import { formatComputed, isNumeric } from '../format';
import { defaults, rowErrors } from '../formValues';
import FieldInput from '../widgets/FieldInput';
import { RemoveButton } from './RemoveButton';
import type { EntityDef, FieldDef, RelatedDef, WireRecord } from '../types';

interface Props {
  def: EntityDef;
  related: RelatedDef;
  fields: FieldDef[];
  rows: WireRecord[];
  onChange: (rows: WireRecord[]) => void;
  errors: Record<string, string>;
}

/** Largura de cada campo (de 12) na tela média: número e conta com 2, o resto divide o que sobra. */
export function inlineWidths(fields: FieldDef[], computed: number): number[] {
  const narrow = fields.filter(isNumeric).length;
  const wide = fields.length - narrow;
  const rest = 12 - 2 * (narrow + computed);
  if (!wide || rest < wide * 2) return fields.map(() => 12 / (fields.length + computed));
  return fields.map((f) => (isNumeric(f) ? 2 : rest / wide));
}

/**
 * Lista with_parent editada no lugar: uma linha de campos por filho, as contas da linha (`computed`) ao lado e
 * "Adicionar" no fim. O primeiro campo leva o número da linha no rótulo ("Descrição do item 2"), para o leitor de
 * tela distinguir as linhas.
 */
export default function ChildInlineRows({ def, related, fields, rows, onChange, errors }: Props) {
  const text = useText();
  const { locale } = useIntl();
  const computed = useMemo(() => (related.computed ?? []).map((c) => ({ ...c, ast: parseFormula(c.value) })), [related.computed]);
  const widths = inlineWidths(fields, computed.length);
  const min = related.minItems ?? 0;
  const max = related.maxItems ?? 200;
  const singular = text(def.label.singular).toLowerCase();
  const of = def.label.gender === 'f' ? 'da' : 'do';
  const set = (i: number, row: WireRecord) => onChange(rows.map((r, j) => (j === i ? row : r)));

  return (
    <>
      <Stack divider={<Box sx={{ borderTop: 1, borderColor: 'divider' }} />}>
        {rows.map((row, i) => {
          const errs = rowErrors(errors, related.entity, i);
          return (
            <Stack key={String(row.id ?? `new-${i}`)} direction="row" sx={{ px: 2.5, py: 2, gap: 1, alignItems: 'flex-start' }}>
              <Grid container spacing={2} sx={{ flex: 1 }}>
                {fields.map((f, c) => (
                  <Grid key={f.name} size={{ xs: 12, sm: 12 / (fields.length + computed.length), md: widths[c] }}>
                    <FieldInput
                      field={c === 0 ? { ...f, label: `${text(f.label, f.name)} ${of} ${singular} ${i + 1}` } : f}
                      value={row[f.name]}
                      record={row}
                      onChange={(v) => set(i, { ...row, [f.name]: v })}
                      error={errs[f.name]}
                      required={f.required}
                    />
                  </Grid>
                ))}
                {computed.map((c, k) => (
                  <Grid key={`c${k}`} size={{ xs: 12, sm: 12 / (fields.length + computed.length), md: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      {text(c.label)}
                    </Typography>
                    <Typography variant="subtitle1">{formatComputed(evalFormula(c.ast, row), locale, c.currency)}</Typography>
                  </Grid>
                ))}
              </Grid>
              <RemoveButton
                disabled={rows.length <= min}
                title={
                  rows.length <= min
                    ? `Precisa de ao menos ${min} ${min === 1 ? singular : text(def.label.plural).toLowerCase()}`
                    : undefined
                }
                label={`Remover ${singular} ${i + 1}`}
                onClick={() => onChange(rows.filter((_, j) => j !== i))}
                inline
              />
            </Stack>
          );
        })}
      </Stack>
      <Box sx={{ px: 2.5, py: 1.5, borderTop: rows.length ? 1 : 0, borderColor: 'divider' }}>
        <Button startIcon={<Add size={18} />} disabled={rows.length >= max} onClick={() => onChange([...rows, defaults(def)])}>
          {`Adicionar ${singular}`}
        </Button>
      </Box>
    </>
  );
}
