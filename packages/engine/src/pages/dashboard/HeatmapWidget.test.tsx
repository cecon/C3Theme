// @vitest-environment jsdom
// Grade de atividade (#183): lê o _aggregate por dia, pinta pela força e o clique abre a lista do dia.
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { SWRConfig } from 'swr';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { C3Client } from '../../api';
import { EngineProvider } from '../../context';
import type { Capabilities, EntityDef } from '../../types';
import HeatmapWidget from './HeatmapWidget';

afterEach(cleanup);

const ALL: Capabilities = { list: true, read: true, create: true, update: true, delete: false };
const turno: EntityDef = {
  name: 'turno',
  label: { singular: 'Turno', plural: 'Turnos' },
  fields: [{ name: 'quando', type: 'date', label: 'Quando' }]
};

function Where() {
  const loc = useLocation();
  return <p data-testid="where">{decodeURIComponent(loc.search)}</p>;
}

function setup(data: unknown[]) {
  const aggregate = vi.fn().mockResolvedValue(data);
  const value = {
    client: { aggregate } as unknown as C3Client,
    app: { name: 'demo' } as never,
    entities: { turno: { def: turno, capabilities: ALL } },
    components: {}
  };
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <IntlProvider locale="pt-BR" onError={() => {}}>
        <SWRConfig value={{ provider: () => new Map() }}>
          <EngineProvider value={value}>
            <MemoryRouter>
              <Routes>
                <Route
                  path="/"
                  element={
                    <HeatmapWidget
                      widget={{ type: 'heatmap', title: 'Atividade', entity: 'turno', groupBy: 'quando', empty: 'Nada no ano.' }}
                    />
                  }
                />
                <Route path="/turno" element={<Where />} />
              </Routes>
            </MemoryRouter>
          </EngineProvider>
        </SWRConfig>
      </IntlProvider>
    </ThemeProvider>
  );
  return aggregate;
}

describe('HeatmapWidget', () => {
  it('pede por dia, mostra o ano e o clique leva à lista daquele dia', async () => {
    const aggregate = setup([
      { key: '2026-03-02', value: 4 },
      { key: '2026-03-03', value: 1 }
    ]);
    expect(await screen.findByRole('img', { name: 'Atividade: 2 dias com registro' })).toBeTruthy();
    expect(aggregate).toHaveBeenCalledWith('turno', { measure: undefined, groupBy: 'quando', interval: 'day', where: undefined });
    const day = document.querySelector('[data-day="2026-03-02"]')!;
    expect(day.getAttribute('title')).toMatch(/02 de mar\.? de 2026: 4/);
    expect(document.querySelectorAll('[data-day]')).toHaveLength(365);
    fireEvent.click(day);
    expect(screen.getByTestId('where').textContent).toContain('{"field":"quando","op":"eq","value":"2026-03-02"}');
  });

  it('sem registro no período: o texto do empty', async () => {
    setup([]);
    expect(await screen.findByText('Nada no ano.')).toBeTruthy();
  });
});
