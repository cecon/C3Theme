import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TablePagination from '@mui/material/TablePagination';
import TextField from '@mui/material/TextField';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  RowSelectionState,
  SortingState,
  useReactTable
} from '@tanstack/react-table';
import { Add, DocumentDownload, SearchNormal1, Trash } from 'iconsax-reactjs';
import { ConfirmDialog, notify, Panel } from '@c3theme/ui';
import { downloadCsv } from '../clientes/csv';
import { CATEGORIES, CategoryId, Product, rating } from './data';
import { useStore } from './store';
import { productColumns } from './lista/columns';
import { ProductTable } from './lista/ProductTable';

const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function ProductListPage() {
  const navigate = useNavigate();
  const { products, removeProducts } = useStore();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CategoryId | 'todas'>('todas');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [deleting, setDeleting] = useState<Product[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const data = useMemo(() => (category === 'todas' ? products : products.filter((p) => p.categoria === category)), [products, category]);

  const columns = useMemo(
    () =>
      productColumns({
        navigate,
        askDelete: (list) => {
          setDeleting(list);
          setConfirmOpen(true);
        }
      }),
    [navigate]
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, rowSelection, globalFilter: search },
    getRowId: (p) => String(p.id),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setSearch,
    globalFilterFn: (row, _c, value: string) =>
      normalize(`${row.original.nome} ${row.original.sku} ${row.original.marca}`).includes(normalize(value)),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } }
  });

  const selected = table.getSelectedRowModel().rows.map((r) => r.original);
  const filtered = table.getFilteredRowModel().rows.map((r) => r.original);

  function exportCsv() {
    downloadCsv(
      'produtos.csv',
      [
        { header: 'SKU', value: (p) => p.sku },
        { header: 'Produto', value: (p) => p.nome },
        { header: 'Marca', value: (p) => p.marca },
        { header: 'Categoria', value: (p) => CATEGORIES[p.categoria] },
        { header: 'Preço', value: (p) => p.preco.toFixed(2).replace('.', ',') },
        { header: 'Estoque', value: (p) => p.estoque },
        { header: 'Avaliação', value: (p) => String(rating(p).avg).replace('.', ',') }
      ],
      selected.length ? selected : filtered
    );
  }

  return (
    <Panel flush>
      <Stack direction={{ xs: 'column', md: 'row' }} sx={{ gap: 2, p: 2.5, alignItems: { md: 'center' }, justifyContent: 'space-between' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1.5, flex: 1 }}>
          <TextField
            label="Buscar"
            size="small"
            placeholder="Nome, SKU ou marca"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: { sm: 280 } }}
            slotProps={{
              htmlInput: { 'aria-label': 'Buscar produtos' },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchNormal1 size={18} />
                  </InputAdornment>
                )
              }
            }}
          />
          <TextField
            select
            size="small"
            label="Categoria"
            value={category}
            onChange={(e) => setCategory(e.target.value as CategoryId | 'todas')}
            sx={{ minWidth: 170 }}
          >
            <MenuItem value="todas">Todas</MenuItem>
            {Object.entries(CATEGORIES).map(([k, v]) => (
              <MenuItem key={k} value={k}>
                {v}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
        <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
          {selected.length > 0 && (
            <Button
              color="error"
              variant="outlined"
              startIcon={<Trash size={18} />}
              onClick={() => {
                setDeleting(selected);
                setConfirmOpen(true);
              }}
            >
              Excluir ({selected.length})
            </Button>
          )}
          <Button
            color="secondary"
            variant="outlined"
            startIcon={<DocumentDownload size={18} />}
            onClick={exportCsv}
            disabled={!filtered.length}
          >
            Exportar CSV
          </Button>
          <Button variant="contained" startIcon={<Add size={18} />} onClick={() => navigate('/apps/loja/novo-produto')}>
            Novo produto
          </Button>
        </Stack>
      </Stack>
      <ProductTable table={table} />
      <TablePagination
        component="div"
        count={filtered.length}
        page={table.getState().pagination.pageIndex}
        rowsPerPage={table.getState().pagination.pageSize}
        rowsPerPageOptions={[5, 10, 25]}
        onPageChange={(_, p) => table.setPageIndex(p)}
        onRowsPerPageChange={(e) => table.setPageSize(Number(e.target.value))}
      />
      <ConfirmDialog
        open={confirmOpen}
        title={deleting.length === 1 ? 'Excluir produto?' : `Excluir ${deleting.length} produtos?`}
        description={
          deleting.length === 1
            ? `${deleting[0].nome} sai do catálogo e do carrinho.`
            : 'Os produtos selecionados saem do catálogo e do carrinho.'
        }
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          const ids = deleting.map((p) => p.id);
          removeProducts(ids);
          setRowSelection((sel) => Object.fromEntries(Object.entries(sel).filter(([id]) => !ids.includes(Number(id)))));
          notify(ids.length === 1 ? 'Produto excluído.' : `${ids.length} produtos excluídos.`);
        }}
      />
    </Panel>
  );
}
