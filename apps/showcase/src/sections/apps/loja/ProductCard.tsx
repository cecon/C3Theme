import { useState } from 'react';
import { Link as RouterLink } from 'react-router';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Rating from '@mui/material/Rating';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { Heart, ShoppingCart } from 'iconsax-reactjs';

import { notify } from '@c3theme/ui';
import { brl, CATEGORIES, COLORS, discountPct, Product, rating } from './data';
import ProductArt from './ProductArt';
import { useStore } from './store';

export function Swatch({ color, size = 14 }: { color: keyof typeof COLORS; size?: number }) {
  return (
    <Box
      component="span"
      title={COLORS[color].nome}
      sx={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        bgcolor: COLORS[color].hex,
        border: 1,
        borderColor: 'divider',
        flexShrink: 0
      }}
    />
  );
}

export function Price({ product, size = 'h5' }: { product: Product; size?: 'h3' | 'h5' }) {
  return (
    <Stack direction="row" sx={{ gap: 1, alignItems: 'baseline', flexWrap: 'wrap' }}>
      <Typography variant={size}>{brl.format(product.preco)}</Typography>
      {product.precoAntigo && (
        <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
          {brl.format(product.precoAntigo)}
        </Typography>
      )}
    </Stack>
  );
}

export default function ProductCard({ product: p }: { product: Product }) {
  const { addToCart } = useStore();
  const [fav, setFav] = useState(false);
  const { avg, total } = rating(p);
  const off = discountPct(p);
  const url = `/apps/loja/produtos/${p.id}`;

  return (
    <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', height: 1, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ position: 'relative', p: 1.5, pb: 0 }}>
        <RouterLink to={url} aria-label={p.nome}>
          <ProductArt forma={p.forma} cor={p.cores[0]} src={p.imagens?.[0]} alt={p.nome} />
        </RouterLink>
        <Stack
          direction="row"
          sx={{ position: 'absolute', top: 20, insetInline: 20, justifyContent: 'space-between', pointerEvents: 'none' }}
        >
          <Stack sx={{ gap: 0.5, alignItems: 'flex-start' }}>
            {off > 0 && <Chip size="small" color="error" label={`-${off}%`} />}
            {p.estoque === 0 && <Chip size="small" label="Esgotado" sx={{ bgcolor: 'background.paper' }} />}
          </Stack>
          <IconButton
            size="small"
            aria-label={fav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            aria-pressed={fav}
            onClick={() => setFav((f) => !f)}
            sx={{
              pointerEvents: 'auto',
              bgcolor: 'background.paper',
              color: fav ? 'error.main' : 'text.secondary',
              '&:hover': { bgcolor: 'background.paper' }
            }}
          >
            <Heart size={18} variant={fav ? 'Bold' : 'Linear'} />
          </IconButton>
        </Stack>
      </Box>
      <Stack sx={{ p: 2, gap: 0.75, flex: 1 }}>
        <Typography variant="caption" color="text.secondary">
          {CATEGORIES[p.categoria]} · {p.marca}
        </Typography>
        <Link component={RouterLink} to={url} underline="hover" color="text.primary" variant="subtitle1" sx={{ lineHeight: 1.3 }}>
          {p.nome}
        </Link>
        <Stack direction="row" sx={{ gap: 0.75, alignItems: 'center' }}>
          <Rating value={avg} precision={0.1} readOnly size="small" />
          <Typography variant="caption" color="text.secondary">
            {avg.toLocaleString('pt-BR')} ({total})
          </Typography>
        </Stack>
        <Stack direction="row" sx={{ gap: 0.5 }}>
          {p.cores.map((c) => (
            <Swatch key={c} color={c} />
          ))}
        </Stack>
        <Stack direction="row" sx={{ mt: 'auto', pt: 1, gap: 1, alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <Price product={p} />
          <Button
            size="small"
            variant="outlined"
            disabled={p.estoque === 0}
            aria-label={`Adicionar ${p.nome} ao carrinho`}
            onClick={() => {
              addToCart({ productId: p.id, cor: p.cores[0], tamanho: p.tamanhos?.[Math.floor(p.tamanhos.length / 2)], qtd: 1 });
              notify(`${p.nome} foi para o carrinho.`);
            }}
            sx={{ minWidth: 0, px: 1.25, flexShrink: 0 }}
          >
            <ShoppingCart size={18} />
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
