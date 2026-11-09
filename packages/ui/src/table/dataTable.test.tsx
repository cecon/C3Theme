// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import type { ColumnDef } from '@tanstack/react-table';
import { afterEach, describe, expect, it, vi } from 'vitest';

import DataTable, { type DataTableProps } from './DataTable';
import { equalsFilter, textFilter } from './meta';

afterEach(cleanup);

interface Item {
  id: string;
  name: string;
  city: string;
  amount: number;
}

const ITEMS: Item[] = Array.from({ length: 23 }, (_, i) => ({
  id: String(i + 1),
  name: `Cliente ${String(i + 1).padStart(2, '0')}`,
  city: i % 2 ? 'Lages' : 'São José',
  amount: (i + 1) * 10
}));

const COLUMNS: ColumnDef<Item, any>[] = [
  { accessorKey: 'name', header: 'Nome', filterFn: textFilter },
  { accessorKey: 'city', header: 'Cidade', filterFn: equalsFilter, meta: { filterVariant: 'select' } },
  { accessorKey: 'amount', header: 'Valor', meta: { filterVariant: 'range', align: 'right' }, filterFn: 'inNumberRange' }
];

const theme = createTheme({ cssVariables: true });
const table = (props: Partial<DataTableProps<Item>> = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <IntlProvider locale="pt-BR" onError={() => {}}>
        <DataTable rows={ITEMS} columns={COLUMNS} getRowId={(r) => r.id} ariaLabel="Clientes" {...props} />
      </IntlProvider>
    </ThemeProvider>
  );

const bodyRows = () => Array.from(screen.getByRole('table', { name: 'Clientes' }).querySelectorAll('tbody > tr')) as HTMLElement[];
const firstCell = () => within(bodyRows()[0]).getAllByRole('cell')[0].textContent;

describe('DataTable', () => {
  it('pagina na tela: 10 por página, faixa "1–10 de 23", próxima página e linhas por página', () => {
    table();
    expect(bodyRows()).toHaveLength(10);
    expect(screen.getByText('1–10 de 23')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /página 2|Go to page 2|page 2/i }));
    expect(firstCell()).toBe('Cliente 11');
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Linhas por página' }));
    fireEvent.click(screen.getByRole('option', { name: '25' }));
    expect(bodyRows()).toHaveLength(23);
  });

  it('"Ir para a página" pula para a página digitada e ignora a que não existe', () => {
    table();
    const jump = screen.getByRole('spinbutton', { name: 'Ir para a página' });
    fireEvent.change(jump, { target: { value: '3' } });
    fireEvent.keyDown(jump, { key: 'Enter' });
    expect(firstCell()).toBe('Cliente 21');
    fireEvent.change(jump, { target: { value: '9' } });
    fireEvent.keyDown(jump, { key: 'Enter' });
    expect(firstCell()).toBe('Cliente 21');
  });

  it('ordena pelo cabeçalho: crescente, decrescente', () => {
    table({ paginate: false });
    const sort = () => within(screen.getByRole('columnheader', { name: /Valor/ })).getByRole('button');
    expect(sort().getAttribute('title')).toMatch(/^Clique para ordenar/);
    // número começa do maior (padrão do TanStack para coluna numérica)
    fireEvent.click(sort());
    expect(sort().getAttribute('title')).toMatch(/^Ordenado do maior para o menor/);
    expect(firstCell()).toBe('Cliente 23');
    fireEvent.click(sort());
    expect(sort().getAttribute('title')).toMatch(/^Ordenado do menor para o maior/);
    expect(firstCell()).toBe('Cliente 01');
  });

  it('filtros por coluna: texto sem acento, lista e faixa de valores; sem resultado mostra o vazio', async () => {
    table({ showFilters: true, paginate: false });
    // os campos de filtro esperam a digitação parar (250 ms)
    fireEvent.change(screen.getByRole('textbox', { name: 'Filtrar Nome' }), { target: { value: 'CLIENTE 0' } });
    await waitFor(() => expect(bodyRows()).toHaveLength(9));
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Valor: valor mínimo' }), { target: { value: '50' } });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Valor: valor máximo' }), { target: { value: '70' } });
    await waitFor(() =>
      expect(bodyRows().map((r) => within(r).getAllByRole('cell')[0].textContent)).toEqual(['Cliente 05', 'Cliente 06', 'Cliente 07'])
    );
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Filtrar Cidade' }));
    fireEvent.click(screen.getByRole('option', { name: 'Lages' }));
    await waitFor(() => expect(bodyRows()).toHaveLength(1));
    fireEvent.change(screen.getByRole('textbox', { name: 'Filtrar Nome' }), { target: { value: 'ninguém' } });
    expect(await screen.findByText('Nada encontrado')).toBeTruthy();
  });

  it('seleção: marca a linha e a página inteira, e devolve os ids', () => {
    const onRowSelectionChange = vi.fn();
    const { rerender } = table({ onRowSelectionChange });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Selecionar linha 1' }));
    expect(onRowSelectionChange).toHaveBeenLastCalledWith({ '1': true });
    rerender(
      <ThemeProvider theme={theme}>
        <IntlProvider locale="pt-BR" onError={() => {}}>
          <DataTable
            rows={ITEMS}
            columns={COLUMNS}
            getRowId={(r) => r.id}
            ariaLabel="Clientes"
            rowSelection={{}}
            onRowSelectionChange={onRowSelectionChange}
          />
        </IntlProvider>
      </ThemeProvider>
    );
    fireEvent.click(screen.getByRole('checkbox', { name: 'Selecionar as linhas da página' }));
    expect(Object.keys(onRowSelectionChange.mock.lastCall![0])).toHaveLength(10);
  });

  it('clique na linha avisa com a linha (densa, listrada e com bordas)', () => {
    const onRowClick = vi.fn();
    table({ onRowClick, dense: true, striped: true, bordered: true });
    fireEvent.click(screen.getByText('Cliente 02'));
    expect(onRowClick.mock.lastCall![0].original.id).toBe('2');
  });

  it('modo servidor: não ordena nem pagina na tela, avisa a página pedida e usa o total do backend', () => {
    const onPaginationChange = vi.fn();
    table({ server: true, rows: ITEMS.slice(0, 10), total: 230, pagination: { pageIndex: 0, pageSize: 10 }, onPaginationChange });
    expect(screen.getByText('1–10 de 230')).toBeTruthy();
    fireEvent.click(screen.getAllByRole('button', { name: /página 2|page 2/i })[0]);
    expect(onPaginationChange).toHaveBeenLastCalledWith({ pageIndex: 1, pageSize: 10 });
  });

  it('carregando sem linhas não mostra o vazio', () => {
    table({ rows: [], loading: true });
    expect(screen.queryByText('Nada encontrado')).toBeNull();
  });
});
