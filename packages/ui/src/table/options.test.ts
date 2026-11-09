import { describe, expect, it } from 'vitest';

import { applyUpdater, dataTableOptions } from './options';
import type { DataTableState } from './options';

type Row = { id: string; name: string };
const rows: Row[] = [{ id: 'a', name: 'Ana' }];

function state(over: Partial<DataTableState> = {}) {
  const calls: Record<string, unknown[]> = { sorting: [], pagination: [], selection: [] };
  const s: DataTableState = {
    sorting: [],
    pagination: { pageIndex: 3, pageSize: 25 },
    rowSelection: {},
    setSorting: (v) => calls.sorting.push(v),
    setPagination: (v) => calls.pagination.push(v),
    setRowSelection: (v) => calls.selection.push(v),
    ...over
  };
  return { s, calls };
}

const config = { rows, columns: [], getRowId: (r: Row) => r.id, paginate: true, selectable: true, facets: false };

describe('dataTableOptions', () => {
  it('no servidor, tudo manual e o total vem do backend', () => {
    const o = dataTableOptions({ ...config, server: true, total: 1234 }, state().s);
    expect(o.manualSorting && o.manualPagination && o.manualFiltering).toBe(true);
    expect(o.rowCount).toBe(1234);
    expect(o.getSortedRowModel).toBeUndefined();
  });
  it('no cliente, o TanStack ordena e pagina', () => {
    const o = dataTableOptions(config, state().s);
    expect(o.manualSorting).toBeUndefined();
    expect(o.getSortedRowModel).toBeTypeOf('function');
    expect(o.getPaginationRowModel).toBeTypeOf('function');
  });
  it('trocar a ordenação volta para a primeira página', () => {
    const { s, calls } = state();
    dataTableOptions(config, s).onSortingChange!([{ id: 'name', desc: true }]);
    expect(calls.sorting).toEqual([[{ id: 'name', desc: true }]]);
    expect(calls.pagination).toEqual([{ pageIndex: 0, pageSize: 25 }]);
  });
  it('seleção pelo id da linha', () => {
    const { s, calls } = state({ rowSelection: { a: true } });
    const o = dataTableOptions(config, s);
    expect(o.getRowId!(rows[0], 0)).toBe('a');
    o.onRowSelectionChange!((old) => ({ ...old, b: true }));
    expect(calls.selection).toEqual([{ a: true, b: true }]);
  });
});

describe('applyUpdater', () => {
  it('aceita valor ou função', () => {
    expect(applyUpdater(2, 1)).toBe(2);
    expect(applyUpdater((n: number) => n + 1, 1)).toBe(2);
  });
});
