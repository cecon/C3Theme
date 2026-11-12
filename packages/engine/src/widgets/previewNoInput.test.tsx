// @vitest-environment jsdom
// Ação sem input com `preview: true` (#66): o clique abre a prévia para conferir; só o confirmar roda.
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { MemoryRouter } from 'react-router';
import { SWRConfig } from 'swr';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { runsAtOnce } from '../actionTypes';
import { EngineProvider } from '../context';
import type { ActionDef, EntityDef } from '../types';
import ListActions from './ListActions';

afterEach(cleanup);

const imprimir = { name: 'imprimir', label: 'Imprimir relação', target: 'list', preview: true } as ActionDef;
const entrega = {
  name: 'entrega',
  label: { singular: 'Entrega', plural: 'Entregas' },
  fields: [],
  actions: [imprimir]
} as unknown as EntityDef;

describe('runsAtOnce', () => {
  it('só roda direto sem input, sem confirmação e sem prévia', () => {
    expect(runsAtOnce({ name: 'a', label: 'A' } as ActionDef)).toBe(true);
    expect(runsAtOnce(imprimir)).toBe(false);
    expect(runsAtOnce({ name: 'a', label: 'A', confirm: 'Certeza?' } as ActionDef)).toBe(false);
    expect(runsAtOnce({ name: 'a', label: 'A', input: { fields: [] } } as unknown as ActionDef)).toBe(false);
  });
});

describe('ação da lista com prévia e sem input', () => {
  it('abre o diálogo com a prévia e roda só ao confirmar', async () => {
    const client = {
      preview: vi.fn(async () => ({ fill: {}, message: 'É assim que sai na impressora.' })),
      prefill: vi.fn(async () => ({})),
      listAction: vi.fn(async () => ({ message: 'Enviada.' }))
    };
    const entities = { entrega: { def: entrega, capabilities: { list: true, read: true, actions: { imprimir: true } } } };
    render(
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <IntlProvider locale="pt-BR" onError={() => {}}>
          <SWRConfig value={{ provider: () => new Map() }}>
            <EngineProvider value={{ client: client as never, app: { name: 'x' } as never, entities: entities as never, components: {} }}>
              <MemoryRouter>
                <ListActions entity="entrega" />
              </MemoryRouter>
            </EngineProvider>
          </SWRConfig>
        </IntlProvider>
      </ThemeProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Imprimir relação' }));
    expect(await screen.findByText('É assim que sai na impressora.')).toBeTruthy();
    expect(client.listAction).not.toHaveBeenCalled();
    const buttons = screen.getAllByRole('button', { name: 'Imprimir relação' });
    fireEvent.click(buttons[buttons.length - 1]);
    await waitFor(() => expect(client.listAction).toHaveBeenCalledTimes(1));
  });
});
