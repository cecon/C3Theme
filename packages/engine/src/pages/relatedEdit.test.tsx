// @vitest-environment jsdom
// Seção related com coluna editável, busca e presets da filha (#38): a contagem do inventário na própria linha.
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { SWRConfig } from 'swr';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { EngineProvider } from '../context';
import { createMemoryClient } from '../memory/memoryClient';
import type { EntityDef, RelatedDef } from '../types';
import RelatedSection from './RelatedSection';

afterEach(cleanup);

const item = {
  name: 'item',
  label: { singular: 'Item', plural: 'Itens' },
  fields: [
    { name: 'inventario', type: 'reference', entity: 'inventario', label: 'Inventário' },
    { name: 'produto', type: 'string', label: 'Produto' },
    { name: 'contado', type: 'integer', label: 'Contado' }
  ],
  views: {
    list: {
      search: ['produto'],
      presets: [{ id: 'falta', label: 'Só não contados', where: { field: 'contado', op: 'null', value: true } }]
    }
  }
} as unknown as EntityDef;
const inventario = { name: 'inventario', label: { singular: 'Inventário', plural: 'Inventários' }, fields: [] } as unknown as EntityDef;

function setup(related: Partial<RelatedDef>) {
  const client = createMemoryClient({
    app: { name: 'demo', entities: ['inventario', 'item'] } as never,
    entities: [inventario, item],
    records: {
      inventario: [{ id: '1' }],
      item: ['Arroz', 'Feijão', 'Café'].map((produto, i) => ({ id: String(i + 1), inventario: '1', produto, contado: i === 2 ? 4 : null }))
    }
  });
  const update = vi.spyOn(client, 'update');
  const caps = { create: true, update: true, delete: true, actions: {} };
  const value = { client, app: { name: 'demo' } as never, entities: { item: { def: item, capabilities: caps } } as never, components: {} };
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <IntlProvider locale="pt-BR" onError={() => {}}>
          <MemoryRouter>
            <EngineProvider value={value}>
              <RelatedSection
                parentId="1"
                related={{ entity: 'item', field: 'inventario', columns: ['produto', 'contado'], editable: ['contado'], ...related }}
              />
            </EngineProvider>
          </MemoryRouter>
        </IntlProvider>
      </ThemeProvider>
    </SWRConfig>
  );
  const cell = (id: string) => document.querySelector<HTMLInputElement>(`[data-edit-cell="${id}:contado"] input`)!;
  return { update, cell };
}

describe('related editável', () => {
  it('digita na linha, Enter grava e desce para a mesma coluna', async () => {
    const { update, cell } = setup({});
    await waitFor(() => expect(cell('1')).toBeTruthy());
    fireEvent.change(cell('1'), { target: { value: '12' } });
    await act(async () => fireEvent.keyDown(cell('1'), { key: 'Enter' }));
    expect(update).toHaveBeenCalledWith('item', '1', { contado: 12 }, expect.anything());
    expect(document.activeElement).toBe(cell('2'));
    // a gravação volta e a seção relê antes do fim do teste
    await act(async () => {
      await update.mock.results[0].value;
    });
    await waitFor(() => expect(cell('1').value).toBe('12'));
  });

  it('busca e presets da filha filtram a seção', async () => {
    const { cell } = setup({ search: true, presets: true });
    await waitFor(() => expect(cell('3')).toBeTruthy());
    fireEvent.click(screen.getByRole('tab', { name: 'Só não contados' }));
    await waitFor(() => expect(document.querySelector('[data-edit-cell="3:contado"]')).toBeNull());
    fireEvent.change(screen.getByRole('textbox', { name: 'Buscar itens' }), { target: { value: 'feij' } });
    await waitFor(() => expect(document.querySelector('[data-edit-cell="1:contado"]')).toBeNull(), { timeout: 2000 });
    expect(cell('2')).toBeTruthy();
  });
});
