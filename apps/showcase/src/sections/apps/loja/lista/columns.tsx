// Colunas da lista de produtos.
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import Rating from '@mui/material/Rating';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { ColumnDef } from '@tanstack/react-table';
import { Edit, Eye, Trash } from 'iconsax-reactjs';
import { StatusChip } from '@c3theme/ui';
import { brl, CATEGORIES, Product, rating } from '../data';
import ProductArt from '../ProductArt';

const stock = (n: number) =>
  n === 0
    ? { label: 'Esgotado', tone: 'danger' as const }
    : n < 10
      ? { label: 'Baixo', tone: 'warning' as const }
      : { label: 'Disponível', tone: 'success' as const };

/** Colunas da lista: seleção, produto, preço, estoque, avaliação, situação e ações. */
export function productColumns({
  navigate,
  askDelete
}: {
  navigate: (to: string) => void;
  askDelete: (list: Product[]) => void;
}): ColumnDef<Product>[] {
  return [
    {
      id: 'selecao',
      enableSorting: false,
      header: ({ table }) => (
        <Checkbox
          size="small"
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={table.getIsSomePageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          slotProps={{ input: { 'aria-label': 'Selecionar todos da página' } }}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          size="small"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          slotProps={{ input: { 'aria-label': `Selecionar ${row.original.nome}` } }}
        />
      )
    },
    {
      accessorKey: 'nome',
      header: 'Produto',
      cell: ({ row: { original: p } }) => (
        <Stack direction="row" sx={{ gap: 1.5, alignItems: 'center', minWidth: 240 }}>
          <Box sx={{ width: 48, flexShrink: 0 }}>
            <ProductArt forma={p.forma} cor={p.cores[0]} src={p.imagens?.[0]} alt="" />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" noWrap>
              {p.nome}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {p.sku} · {p.marca}
            </Typography>
          </Box>
        </Stack>
      )
    },
    { id: 'categoria', accessorFn: (p) => CATEGORIES[p.categoria], header: 'Categoria' },
    {
      accessorKey: 'preco',
      header: 'Preço',
      cell: ({ row: { original: p } }) => (
        <Box sx={{ whiteSpace: 'nowrap' }}>
          <Typography variant="body2">{brl.format(p.preco)}</Typography>
          {p.precoAntigo && (
            <Typography variant="caption" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
              {brl.format(p.precoAntigo)}
            </Typography>
          )}
        </Box>
      )
    },
    { accessorKey: 'estoque', header: 'Estoque' },
    {
      id: 'avaliacao',
      accessorFn: (p) => rating(p).avg,
      header: 'Avaliação',
      cell: ({ getValue }) => <Rating value={getValue<number>()} precision={0.1} readOnly size="small" />
    },
    {
      id: 'situacao',
      accessorFn: (p) => p.estoque,
      header: 'Situação',
      enableSorting: false,
      cell: ({ getValue }) => {
        const s = stock(getValue<number>());
        return <StatusChip label={s.label} tone={s.tone} />;
      }
    },
    {
      id: 'acoes',
      enableSorting: false,
      header: () => <Box sx={{ textAlign: 'center' }}>Ações</Box>,
      cell: ({ row: { original: p } }) => (
        <Stack direction="row" sx={{ justifyContent: 'center' }}>
          <Tooltip title="Ver na loja">
            <IconButton size="small" color="secondary" aria-label={`Ver ${p.nome}`} onClick={() => navigate(`/apps/loja/produtos/${p.id}`)}>
              <Eye size={18} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Editar">
            <IconButton
              size="small"
              color="primary"
              aria-label={`Editar ${p.nome}`}
              onClick={() => navigate(`/apps/loja/novo-produto?editar=${p.id}`)}
            >
              <Edit size={18} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Excluir">
            <IconButton size="small" color="error" aria-label={`Excluir ${p.nome}`} onClick={() => askDelete([p])}>
              <Trash size={18} />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ];
}
