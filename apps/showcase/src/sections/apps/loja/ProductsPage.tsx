import { useMemo, useState } from 'react';

// material-ui
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

// third-party
import { CloseCircle, Filter, SearchNormal1, SearchStatus } from 'iconsax-reactjs';

import { MessagePage, SoftAvatar } from '@c3theme/ui';
import CartButton from './CartButton';
import { CATEGORIES, CategoryId, COLORS, Product, rating } from './data';
import ProductCard from './ProductCard';
import ProductFilters, { activeFilterCount, emptyFilters, Filters } from './ProductFilters';
import { useStore } from './store';

const SORTS = {
  relevancia: { label: 'Mais relevantes', fn: (a: Product, b: Product) => rating(b).total - rating(a).total },
  novidades: { label: 'Novidades', fn: (a: Product, b: Product) => b.criadoEm.localeCompare(a.criadoEm) },
  menorPreco: { label: 'Menor preço', fn: (a: Product, b: Product) => a.preco - b.preco },
  maiorPreco: { label: 'Maior preço', fn: (a: Product, b: Product) => b.preco - a.preco },
  avaliacao: { label: 'Mais bem avaliados', fn: (a: Product, b: Product) => rating(b).avg - rating(a).avg }
};
type SortKey = keyof typeof SORTS;

const DRAWER = 280;

const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function ProductsPage() {
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('lg'));
  const { products } = useStore();
  const maxPrice = useMemo(() => Math.ceil(Math.max(100, ...products.map((p) => p.preco)) / 100) * 100, [products]);

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('relevancia');
  const [filters, setFilters] = useState<Filters>(() => emptyFilters(maxPrice));
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const counts = useMemo(() => {
    const out = Object.fromEntries(Object.keys(CATEGORIES).map((k) => [k, 0])) as Record<CategoryId, number>;
    products.forEach((p) => out[p.categoria]++);
    return out;
  }, [products]);

  const list = useMemo(() => {
    const q = normalize(search.trim());
    return products
      .filter((p) => {
        if (q && !normalize(`${p.nome} ${p.marca} ${CATEGORIES[p.categoria]} ${p.cores.map((c) => COLORS[c].nome).join(' ')}`).includes(q))
          return false;
        if (filters.categorias.length && !filters.categorias.includes(p.categoria)) return false;
        if (p.preco < filters.preco[0] || p.preco > filters.preco[1]) return false;
        if (filters.nota && rating(p).avg < filters.nota) return false;
        if (filters.cores.length && !p.cores.some((c) => filters.cores.includes(c))) return false;
        if (filters.emEstoque && p.estoque === 0) return false;
        return true;
      })
      .sort(SORTS[sort].fn);
  }, [products, search, filters, sort]);

  const active = activeFilterCount(filters, maxPrice);
  const open = desktop ? desktopOpen : mobileOpen;
  const clearAll = () => {
    setFilters(emptyFilters(maxPrice));
    setSearch('');
  };

  const filterBody = <ProductFilters value={filters} maxPrice={maxPrice} counts={counts} onChange={setFilters} />;

  return (
    <Stack sx={{ gap: 3 }}>
      <Paper variant="outlined" sx={{ borderRadius: 3, p: 1.5 }}>
        <Stack direction="row" sx={{ gap: 1.5, alignItems: 'center', flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
          <Button
            color="secondary"
            variant={open ? 'contained' : 'outlined'}
            onClick={() => (desktop ? setDesktopOpen((o) => !o) : setMobileOpen(true))}
            aria-expanded={open}
            startIcon={
              <Badge badgeContent={active} color="primary">
                <Filter size={18} />
              </Badge>
            }
            sx={{ flexShrink: 0 }}
          >
            Filtros
          </Button>
          <TextField
            label="Buscar"
            size="small"
            placeholder="Nome do produto"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 1, minWidth: { xs: '100%', md: 200 }, order: { xs: 3, md: 0 } }}
            slotProps={{
              htmlInput: { 'aria-label': 'Buscar produtos' },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchNormal1 size={18} />
                  </InputAdornment>
                ),
                endAdornment: search && (
                  <InputAdornment position="end">
                    <IconButton size="small" aria-label="Limpar busca" onClick={() => setSearch('')}>
                      <CloseCircle size={16} />
                    </IconButton>
                  </InputAdornment>
                )
              }
            }}
          />
          <TextField
            select
            size="small"
            label="Ordenar"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            sx={{ minWidth: 170, flex: { xs: '1 1 100%', md: 'none' }, order: { xs: 2, md: 0 } }}
          >
            {Object.entries(SORTS).map(([k, s]) => (
              <MenuItem key={k} value={k}>
                {s.label}
              </MenuItem>
            ))}
          </TextField>
          <Box sx={{ marginInlineStart: { xs: 'auto', md: 0 } }}>
            <CartButton />
          </Box>
        </Stack>
      </Paper>

      <Stack direction="row" sx={{ alignItems: 'flex-start' }}>
        {desktop ? (
          <Box
            sx={{
              width: desktopOpen ? DRAWER : 0,
              flexShrink: 0,
              overflow: 'hidden',
              transition: theme.transitions.create('width'),
              marginInlineEnd: desktopOpen ? 3 : 0
            }}
          >
            <Paper variant="outlined" sx={{ borderRadius: 3, width: DRAWER, position: 'sticky', top: 88 }}>
              {filterBody}
            </Paper>
          </Box>
        ) : (
          <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)} slotProps={{ paper: { sx: { width: DRAWER } } }}>
            {filterBody}
            <Box sx={{ p: 2.5, mt: 'auto' }}>
              <Button fullWidth variant="contained" onClick={() => setMobileOpen(false)}>
                Ver {list.length} {list.length === 1 ? 'produto' : 'produtos'}
              </Button>
            </Box>
          </Drawer>
        )}

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {list.length} {list.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
          </Typography>
          {list.length === 0 ? (
            <Paper variant="outlined" sx={{ borderRadius: 3 }}>
              <MessagePage
                icon={
                  <SoftAvatar tone="secondary" size="xl">
                    <SearchStatus size={36} variant="Bulk" />
                  </SoftAvatar>
                }
                title="Nenhum produto encontrado"
                description="Ajuste a busca ou os filtros para ver mais opções."
                action={
                  <Button variant="contained" onClick={clearAll}>
                    Limpar filtros
                  </Button>
                }
              />
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {list.map((p) => (
                <Grid key={p.id} size={{ xs: 12, sm: 6, md: 4, xl: open ? 4 : 3 }}>
                  <ProductCard product={p} />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Stack>
    </Stack>
  );
}
