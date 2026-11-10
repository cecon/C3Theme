// Destaque da linha (`views.list.rowStyles`, #54) e número negativo no tom do campo (`negativeTone`): a lista,
// o relatório e a impressão usam as mesmas regras. Sem React.

import type { Theme } from '@mui/material/styles';
import { softColors, toneText } from '@c3theme/ui';
import type { SystemStyleObject } from '@mui/system';

import { evaluate, type FieldType } from './conditions.mjs';
import type { FieldDef, RowStyle, Tone } from './types';

export interface RowLook {
  bold: boolean;
  tone?: RowStyle['tone'];
}

/** Soma das regras que valem para a linha: negrito de qualquer uma, o tom da última. Nenhuma: undefined. */
export function rowLook(styles: RowStyle[] | undefined, row: Record<string, unknown>, types: Record<string, FieldType>) {
  let look: RowLook | undefined;
  for (const s of styles ?? []) {
    if (!evaluate(s.when, row, types)) continue;
    look = { bold: Boolean(look?.bold || s.bold), tone: s.tone ?? look?.tone };
  }
  return look;
}

/** sx da linha da tabela: negrito em todas as células (inclusive o texto do Typography) e fundo claro do tom. */
export function rowLookSx(look: RowLook | undefined) {
  if (!look) return undefined;
  const tone = look.tone;
  return {
    ...(look.bold && { '& > td, & > td .MuiTypography-root': { fontWeight: 600 } }),
    ...(tone && {
      '& > td': {
        bgcolor: (t: { vars?: { palette: Record<string, { mainChannel: string }> } }) =>
          t.vars ? `rgb(${t.vars.palette[tone].mainChannel} / 0.08)` : 'action.hover'
      },
      '@media print': { '& > td': { printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' } }
    })
  };
}

/** Função da linha para a tabela, ou nada quando a view não declara `rowStyles`. */
export function rowStyler(styles: RowStyle[] | undefined, fields: FieldDef[]) {
  if (!styles?.length) return undefined;
  const types = Object.fromEntries(fields.map((f) => [f.name, f.type])) as Record<string, FieldType>;
  return (row: Record<string, unknown>) => rowLookSx(rowLook(styles, row, types));
}

/** Tom do valor: o `negativeTone` do campo quando o número é menor que zero (decimal trafega como texto). */
export function negativeTone(field: FieldDef, value: unknown): FieldDef['negativeTone'] {
  if (!field.negativeTone || (field.type !== 'integer' && field.type !== 'decimal')) return undefined;
  if (value === null || value === undefined || value === '') return undefined;
  return Number(value) < 0 ? field.negativeTone : undefined;
}

/** Tom da célula (`columns[].tone`): o `map` pelo valor do outro campo, ou a cor da opção dele (enum). */
export function cellTone(
  tone: { field: FieldDef; map?: Record<string, Tone> } | undefined,
  row: Record<string, unknown>
): Tone | undefined {
  if (!tone) return undefined;
  const raw = row[tone.field.name];
  if (raw === null || raw === undefined || raw === '') return undefined;
  const v = typeof raw === 'object' && 'id' in raw ? String((raw as { id: unknown }).id) : String(raw);
  if (tone.map) return tone.map[v];
  return tone.field.options?.find((o) => String(o.value) === v)?.color;
}

/** Fundo suave e texto no tom, legíveis no claro e no escuro (os do `StatusChip`); `false` sem tom. */
export function cellToneSx(tone: Parameters<typeof cellTone>[0], row: Record<string, unknown>) {
  const t = cellTone(tone, row);
  return !t || t === 'neutral' ? (false as const) : (theme: Theme) => softColors(theme, t) as SystemStyleObject<Theme>;
}

/**
 * Cor do valor negativo, para um item de `sx` em lista (`sx={[base, negativeSx(f, v)]}`), ou `false`. O tom escuro
 * no claro e o claro clareado no escuro: o `main` não chega a 4,5:1 sobre o fundo de destaque da linha.
 */
export const negativeSx = (field: FieldDef, value: unknown): false | ((t: Theme) => SystemStyleObject<Theme>) => {
  const tone = negativeTone(field, value);
  if (!tone) return false as const;
  return (t: Theme) => toneText(t, tone === 'error' ? 'danger' : tone) as SystemStyleObject<Theme>;
};
