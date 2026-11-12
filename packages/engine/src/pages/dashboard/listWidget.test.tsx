// @vitest-environment jsdom
// Painel (#64): lista com abas e seletor, mais de 10 linhas rolando no cartão, aviso com soma e KPI com variação.
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { MemoryRouter } from 'react-router';
import { SWRConfig } from 'swr';
import { afterEach, describe, expect, it } from 'vitest';

import { EngineProvider } from '../../context';
import { createMemoryClient } from '../../memory/memoryClient';
import type { EntityDef } from '../../types';
import AlertWidget from './AlertWidget';
import KpiWidget from './KpiWidget';
import ListWidget from './ListWidget';

afterEach(cleanup);

const titulo = (name: string): EntityDef =>
  ({
    name,
    label: { singular: 'Título', plural: 'Títulos' },
    titleField: 'numero',
    fields: [
      { name: 'numero', type: 'string', label: 'Número' },
      {
        name: 'situacao',
        type: 'enum',
        label: 'Situação',
        options: [
          { value: 'A', label: 'Aberto' },
          { value: 'B', label: 'Baixado' }
        ]
      },
      { name: 'valor', type: 'decimal', label: 'Valor', scale: 2 },
      { name: 'mes', type: 'integer', label: 'Mês' }
    ]
  }) as unknown as EntityDef;
const receber = titulo('receber');
const pagar = titulo('pagar');

function mount(children: ReactNode) {
  const rows = (prefix: string, n: number) =>
    Array.from({ length: n }, (_, i) => ({
      id: String(i + 1),
      numero: `${prefix}${i + 1}`,
      situacao: i % 2 ? 'B' : 'A',
      valor: '10.00',
      mes: i < 4 ? 10 : 9
    }));
  const client = createMemoryClient({
    app: { name: 'x', entities: ['receber', 'pagar'] } as never,
    entities: [receber, pagar],
    records: { receber: rows('R', 14), pagar: rows('P', 3) }
  });
  const caps = { list: true, read: true, create: false, update: false, delete: false, actions: {} };
  const entities = { receber: { def: receber, capabilities: caps }, pagar: { def: pagar, capabilities: caps } };
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <IntlProvider locale="pt-BR" onError={() => {}}>
        <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
          <EngineProvider value={{ client, app: { name: 'x' } as never, entities: entities as never, components: {} }}>
            <MemoryRouter>{children}</MemoryRouter>
          </EngineProvider>
        </SWRConfig>
      </IntlProvider>
    </ThemeProvider>
  );
}

describe('lista do painel', () => {
  it('mais de 10 linhas rolam no cartão; as abas trocam de entidade; o seletor filtra', async () => {
    mount(
      <ListWidget
        widget={{
          type: 'list',
          title: 'Títulos',
          entity: 'receber',
          columns: ['numero', 'situacao'],
          limit: 50,
          filter: 'situacao',
          tabs: [{ label: 'A receber' }, { label: 'A pagar', entity: 'pagar' }]
        }}
      />
    );
    expect(await screen.findByText('R14')).toBeTruthy();
    expect(screen.getByLabelText(/Títulos: 14 linhas, role para ver todas/)).toBeTruthy();
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Situação' }));
    fireEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: 'Baixado' }));
    await waitFor(() => expect(screen.queryByText('R1')).toBeNull());
    expect(screen.getByText('R2')).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: 'A pagar' }));
    expect(await screen.findByText('P2')).toBeTruthy();
    expect(screen.queryByText('P1')).toBeNull();
    expect(screen.queryByLabelText(/role para ver todas/)).toBeNull();
  });
});

describe('aviso e KPI', () => {
  it('o aviso traz a contagem e a soma; o KPI mostra a variação sobre o outro recorte', async () => {
    mount(
      <>
        <AlertWidget widget={{ type: 'alert', title: '', entity: 'pagar', measure: 'sum:valor', text: '{count} a pagar, {value}' }} />
        <KpiWidget
          widget={{
            type: 'kpi',
            title: 'Recebido',
            entity: 'receber',
            measure: 'sum:valor',
            where: { field: 'mes', op: 'eq', value: 10 },
            compare: { label: 'setembro', where: { field: 'mes', op: 'eq', value: 9 } }
          }}
        />
      </>
    );
    expect(await screen.findByText('3 a pagar, 30,00')).toBeTruthy();
    // outubro 4 × 10 = 40; setembro 10 × 10 = 100: caiu 60%
    expect(await screen.findByLabelText('Caiu 60% em relação a setembro')).toBeTruthy();
  });
});
