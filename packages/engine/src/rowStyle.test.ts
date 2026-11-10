// Destaque da linha (`views.list.rowStyles`) e número negativo no tom do campo (`negativeTone`), #54.
import { createTheme } from '@mui/material/styles';
import { describe, expect, it } from 'vitest';

import { negativeSx, negativeTone, rowLook, rowLookSx, rowStyler } from './rowStyle';
import type { FieldDef, RowStyle } from './types';

const styles: RowStyle[] = [
  { when: { field: 'tipo', op: 'in', value: ['TITULO', 'TOTAL'] }, bold: true, tone: 'secondary' },
  { when: { field: 'analitica', op: 'eq', value: false }, bold: true },
  { when: { field: 'tipo', op: 'eq', value: 'TOTAL' }, tone: 'warning' }
];
const types = { tipo: 'string', analitica: 'boolean' } as const;

describe('rowLook', () => {
  it('soma as regras que valem: negrito de qualquer uma, o tom da última', () => {
    expect(rowLook(styles, { tipo: 'CONTA', analitica: true }, types)).toBeUndefined();
    expect(rowLook(styles, { tipo: 'CONTA', analitica: false }, types)).toEqual({ bold: true, tone: undefined });
    expect(rowLook(styles, { tipo: 'TITULO', analitica: true }, types)).toEqual({ bold: true, tone: 'secondary' });
    expect(rowLook(styles, { tipo: 'TOTAL', analitica: true }, types)).toEqual({ bold: true, tone: 'warning' });
    expect(rowLook(undefined, {}, types)).toBeUndefined();
  });

  it('vira sx: negrito nas células e fundo claro do tom, que sai no papel', () => {
    expect(rowLookSx(undefined)).toBeUndefined();
    expect(rowLookSx({ bold: true })).toEqual({ '& > td, & > td .MuiTypography-root': { fontWeight: 600 } });
    const sx = rowLookSx({ bold: false, tone: 'error' }) as Record<string, any>;
    const bg = sx['& > td'].bgcolor;
    expect(bg({ vars: { palette: { error: { mainChannel: '1 2 3' } } } })).toBe('rgb(1 2 3 / 0.08)');
    expect(bg({})).toBe('action.hover');
    expect(sx['@media print']['& > td'].printColorAdjust).toBe('exact');
  });

  it('rowStyler: nada sem regras; com elas, uma função por linha com os tipos dos campos', () => {
    const fields = [
      { name: 'tipo', type: 'string' },
      { name: 'analitica', type: 'boolean' }
    ] as FieldDef[];
    expect(rowStyler(undefined, fields)).toBeUndefined();
    expect(rowStyler([], fields)).toBeUndefined();
    expect(rowStyler(styles, fields)!({ tipo: 'CONTA', analitica: false })).toEqual(rowLookSx({ bold: true }));
  });
});

describe('negativeTone', () => {
  const saldo = { name: 'saldo', type: 'decimal', negativeTone: 'error' } as FieldDef;
  it('só número menor que zero em integer ou decimal com negativeTone', () => {
    expect(negativeTone(saldo, '-0.01')).toBe('error');
    expect(negativeTone(saldo, -3)).toBe('error');
    expect(negativeTone(saldo, '0.00')).toBeUndefined();
    expect(negativeTone(saldo, '12.50')).toBeUndefined();
    expect(negativeTone(saldo, null)).toBeUndefined();
    expect(negativeTone(saldo, '')).toBeUndefined();
    expect(negativeTone({ ...saldo, negativeTone: undefined }, '-1')).toBeUndefined();
    expect(negativeTone({ ...saldo, type: 'string' }, '-1')).toBeUndefined();
  });
  it('negativeSx devolve a cor do tom (escuro no claro, claro no escuro)', () => {
    const sx = negativeSx(saldo, '-1');
    const theme = createTheme({ cssVariables: { colorSchemeSelector: 'class' }, colorSchemes: { light: true, dark: true } });
    expect(sx && sx(theme)).toMatchObject({ color: theme.palette.error.dark });
    expect(negativeSx(saldo, '1')).toBe(false);
  });
});
