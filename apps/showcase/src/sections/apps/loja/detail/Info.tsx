// Coluna de informações do produto: preço, cor, tamanho e compra.
import { useState } from 'react';
import { useNavigate } from 'react-router';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Rating from '@mui/material/Rating';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { ArrowRotateLeft, ShoppingCart, Truck } from 'iconsax-reactjs';
import { notify, StatusChip } from '@c3theme/ui';
import { brl, CATEGORIES, COLORS, ColorId, discountPct, Product, rating } from '../data';
import { Price } from '../ProductCard';
import QtyInput from '../QtyInput';
import { useStore } from '../store';

function stockChip(estoque: number) {
  if (estoque === 0) return <StatusChip label="Esgotado" tone="danger" />;
  if (estoque < 10) return <StatusChip label={`Últimas ${estoque} unidades`} tone="warning" />;
  return <StatusChip label="Em estoque" tone="success" />;
}

export function Info({ product: p, cor, onColor }: { product: Product; cor: ColorId; onColor: (c: ColorId) => void }) {
  const navigate = useNavigate();
  const { addToCart } = useStore();
  const [tamanho, setTamanho] = useState<string | null>(p.tamanhos?.length === 1 ? p.tamanhos[0] : null);
  const [qtd, setQtd] = useState(1);
  const [sizeError, setSizeError] = useState(false);
  const { avg, total } = rating(p);
  const off = discountPct(p);

  function add(goToCheckout: boolean) {
    if (p.tamanhos && !tamanho) return setSizeError(true);
    addToCart({ productId: p.id, cor, tamanho: tamanho ?? undefined, qtd });
    if (goToCheckout) navigate('/apps/loja/checkout');
    else notify(`${qtd} × ${p.nome} no carrinho.`);
  }

  return (
    <Stack sx={{ gap: 2.5 }}>
      <Box>
        <Stack direction="row" sx={{ gap: 1, alignItems: 'center', mb: 1, flexWrap: 'wrap' }}>
          <Chip size="small" label={CATEGORIES[p.categoria]} />
          {stockChip(p.estoque)}
        </Stack>
        <Typography variant="h3" component="h2">
          {p.nome}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {p.marca} · SKU {p.sku}
        </Typography>
        <Stack direction="row" sx={{ gap: 1, alignItems: 'center', mt: 1 }}>
          <Rating value={avg} precision={0.1} readOnly size="small" />
          <Typography variant="body2" color="text.secondary">
            {avg.toLocaleString('pt-BR')} · {total} avaliações
          </Typography>
        </Stack>
      </Box>
      <Box>
        <Stack direction="row" sx={{ gap: 1.5, alignItems: 'center' }}>
          <Price product={p} size="h3" />
          {off > 0 && <Chip size="small" color="error" label={`-${off}%`} />}
        </Stack>
        <Typography variant="body2" color="text.secondary">
          ou 10× de {brl.format(p.preco / 10)} sem juros
        </Typography>
      </Box>
      <Typography color="text.secondary">{p.resumo}</Typography>
      <Divider />

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Cor:{' '}
          <Box component="span" sx={{ fontWeight: 400, color: 'text.secondary' }}>
            {COLORS[cor].nome}
          </Box>
        </Typography>
        <Stack direction="row" sx={{ gap: 1 }} role="radiogroup" aria-label="Cor">
          {p.cores.map((c) => (
            <Tooltip key={c} title={COLORS[c].nome}>
              <Box
                component="button"
                type="button"
                role="radio"
                aria-checked={c === cor}
                aria-label={COLORS[c].nome}
                onClick={() => onColor(c)}
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  bgcolor: COLORS[c].hex,
                  cursor: 'pointer',
                  border: 3,
                  borderColor: 'background.paper',
                  boxShadow: (t) => `0 0 0 2px ${c === cor ? t.vars.palette.primary.main : t.vars.palette.divider}`
                }}
              />
            </Tooltip>
          ))}
        </Stack>
      </Box>

      {p.tamanhos && (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Tamanho
          </Typography>
          <ToggleButtonGroup
            exclusive
            value={tamanho}
            onChange={(_, v: string | null) => {
              setTamanho(v);
              setSizeError(false);
            }}
            aria-label="Tamanho"
            size="small"
            sx={{
              flexWrap: 'wrap',
              gap: 1,
              '& .MuiToggleButtonGroup-grouped': { border: 1, borderColor: 'divider', borderRadius: '8px !important', minWidth: 44, m: 0 }
            }}
          >
            {p.tamanhos.map((t) => (
              <ToggleButton key={t} value={t} color="primary">
                {t}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          {sizeError && (
            <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }} role="alert">
              Escolha um tamanho.
            </Typography>
          )}
        </Box>
      )}

      <Stack sx={{ gap: 1.5 }}>
        <Stack direction="row" sx={{ gap: 1.5, alignItems: 'center' }}>
          <QtyInput value={qtd} max={Math.max(1, p.estoque)} onChange={setQtd} />
          <Button
            variant="outlined"
            size="large"
            startIcon={<ShoppingCart size={20} />}
            disabled={p.estoque === 0}
            onClick={() => add(false)}
            sx={{ flex: 1, whiteSpace: 'nowrap' }}
          >
            Adicionar
          </Button>
        </Stack>
        <Button variant="contained" size="large" disabled={p.estoque === 0} onClick={() => add(true)} fullWidth>
          Comprar agora
        </Button>
      </Stack>

      <Stack sx={{ gap: 1.25, p: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
        <Stack direction="row" sx={{ gap: 1.5, alignItems: 'center' }}>
          <Truck size={20} />
          <Typography variant="body2">Frete grátis em compras acima de R$ 299</Typography>
        </Stack>
        <Stack direction="row" sx={{ gap: 1.5, alignItems: 'center' }}>
          <ArrowRotateLeft size={20} />
          <Typography variant="body2">Troca ou devolução grátis em até 30 dias</Typography>
        </Stack>
      </Stack>
    </Stack>
  );
}
