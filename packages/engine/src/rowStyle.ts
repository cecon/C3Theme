// Destaque da linha (`views.list.rowStyles`, #54) e número negativo no tom do campo (`negativeTone`): a lista,
// o relatório e a impressão usam as mesmas regras. Sem React.

import { lighten, type Theme } from '@mui/material/styles';
import type { SystemStyleObject } from '@mui/system';

import { evaluate, type FieldType } from './conditions.mjs';
import type { FieldDef, RowStyle } from './types';

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

/**
 * Cor do valor negativo, para um item de `sx` em lista (`sx={[base, negativeSx(f, v)]}`), ou `false`. O tom escuro
 * no claro e o claro clareado no escuro: o `main` não chega a 4,5:1 sobre o fundo de destaque da linha.
 */
export const negativeSx = (field: FieldDef, value: unknown): false | ((t: Theme) => SystemStyleObject<Theme>) => {
  const tone = negativeTone(field, value);
  if (!tone) return false as const;
  return (t: Theme) => {
    const dark = t.colorSchemes?.dark?.palette?.[tone].light ?? t.palette[tone].light;
    return { color: t.palette[tone].dark, ...t.applyStyles('dark', { color: lighten(dark, 0.25) }) };
  };
};
