// @vitest-environment jsdom
// Ação que fica aberta para a próxima leitura (#37): depois do sucesso o diálogo fica, o campo limpa e volta o foco,
// e o resultado aparece no diálogo com as leituras anteriores.
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { MemoryRouter } from 'react-router';
import { SWRConfig } from 'swr';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { C3Client } from '../api';
import { EngineProvider } from '../context';
import type { Capabilities, EntityDef } from '../types';
import RecordActions from './RecordActions';

afterEach(cleanup);

const inventario: EntityDef = {
  name: 'inventario',
  label: { singular: 'Inventário', plural: 'Inventários' },
  fields: [{ name: 'nome', type: 'string' }],
  actions: [
    {
      name: 'bipar',
      label: 'Bipar',
      repeat: true,
      input: { fields: [{ name: 'codigo', type: 'string', label: 'Código', required: true }] }
    }
  ]
};
const CAPS: Capabilities = { list: true, read: true, create: true, update: true, delete: false, actions: { bipar: true } };

function setup() {
  let n = 0;
  const action = vi.fn().mockImplementation(async (_e: string, _id: string, _a: string, input: { codigo: string }) => ({
    data: { id: '1', nome: 'Loja' },
    message: `${input.codigo}: contado ${++n}.`
  }));
  const value = {
    client: { action } as unknown as C3Client,
    app: { name: 'demo' } as never,
    entities: { inventario: { def: inventario, capabilities: CAPS } },
    components: {}
  };
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <IntlProvider locale="pt-BR" onError={() => {}}>
        <SWRConfig value={{ provider: () => new Map() }}>
          <MemoryRouter>
            <EngineProvider value={value}>
              <RecordActions entity="inventario" id="1" record={{ id: '1', nome: 'Loja' }} />
            </EngineProvider>
          </MemoryRouter>
        </SWRConfig>
      </IntlProvider>
    </ThemeProvider>
  );
  return { action };
}

describe('ação repeat', () => {
  it('fica aberta, limpa o campo e mostra a última leitura e as anteriores', async () => {
    const { action } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Bipar' }));
    const field = () => screen.getByRole('textbox', { name: /Código/ }) as HTMLInputElement;
    const read = async (code: string) => {
      fireEvent.change(await screen.findByRole('textbox', { name: /Código/ }), { target: { value: code } });
      fireEvent.click(screen.getByRole('button', { name: /Confirmar|Bipar/, hidden: false }));
      await waitFor(() => expect(screen.getByRole('status').textContent).toContain(`${code}:`));
    };
    await read('CAFE');
    await read('ARROZ');
    expect(action).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(field().value).toBe('');
    expect(document.activeElement).toBe(field());
    expect(screen.getByRole('status').textContent).toContain('ARROZ: contado 2.');
    expect(screen.getByRole('list', { name: 'Leituras anteriores' }).textContent).toContain('CAFE: contado 1.');
  });
});
