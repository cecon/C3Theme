// @vitest-environment jsdom
// #54: linha em negrito com fundo pelo `rowStyles` e número negativo no tom do campo, na lista e no relatório.
import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';

import { EngineProvider } from '../../context';
import { rowStyler } from '../../rowStyle';
import type { FieldDef, RowStyle } from '../../types';
import ReportTable from '../report/ReportTable';
import ListTable from './ListTable';

afterEach(cleanup);

const fields = [
  { name: 'conta', type: 'string', label: 'Conta' },
  { name: 'tipo', type: 'string', label: 'Tipo' },
  { name: 'saldo', type: 'decimal', scale: 2, label: 'Saldo', negativeTone: 'error' }
] as FieldDef[];
const styles: RowStyle[] = [{ when: { field: 'tipo', op: 'eq', value: 'TOTAL' }, bold: true, tone: 'secondary' }];
const rows = [
  { id: '1', conta: 'Caixa', tipo: 'CONTA', saldo: '-150.00' },
  { id: '2', conta: '(=) Resultado', tipo: 'TOTAL', saldo: '320.00' }
];
// toneText: o vermelho escuro do tema, pela variável CSS
const RED = 'var(--mui-palette-error-dark)';

function wrap(children: ReactNode) {
  const value = { client: {} as never, app: { name: 'x' } as never, entities: {}, components: {} };
  return render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <IntlProvider locale="pt-BR" onError={() => {}}>
        <MemoryRouter>
          <EngineProvider value={value}>{children}</EngineProvider>
        </MemoryRouter>
      </IntlProvider>
    </ThemeProvider>
  );
}

const weight = (text: string) => getComputedStyle(screen.getByText(text)).fontWeight;
const color = (text: string) => getComputedStyle(screen.getByText(text)).color;

describe('lista', () => {
  it('negrito na linha que a condição pega, vermelho no negativo e no total negativo', () => {
    wrap(
      <ListTable
        entity="conta"
        columns={fields.map((def) => ({ field: def.name, def, extras: {} }))}
        rows={rows}
        loading={false}
        skeletonRows={1}
        sort={{ field: 'conta', dir: 'asc' }}
        onSort={() => {}}
        totals={{ saldo: '-10.00' }}
        rowSx={rowStyler(styles, fields)}
      />
    );
    expect(weight('(=) Resultado')).toBe('600');
    expect(weight('Caixa')).not.toBe('600');
    expect(color('-150,00')).toBe(RED);
    expect(color('320,00')).not.toBe(RED);
    expect(color('-10,00')).toBe(RED);
  });
});

describe('relatório', () => {
  it('as mesmas regras na linha do relatório', () => {
    wrap(
      <ReportTable
        columns={fields}
        lines={rows.map((row) => ({ kind: 'row', row, depth: 0 }) as never)}
        rowSx={rowStyler(styles, fields)}
      />
    );
    expect(weight('(=) Resultado')).toBe('600');
    expect(color('-150,00')).toBe(RED);
  });
});
