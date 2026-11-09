import { Link as RouterLink } from 'react-router';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// third-party
import { ArrowLeft, ShoppingCart, Trash } from 'iconsax-reactjs';

import { MessagePage, notify, Panel, SoftAvatar } from '@c3theme/ui';
import { brl, COLORS } from '../data';
import ProductArt from '../ProductArt';
import { Swatch } from '../ProductCard';
import QtyInput from '../QtyInput';
import { useStore } from '../store';

export function EmptyCart() {
  return (
    <Panel>
      <MessagePage
        icon={
          <SoftAvatar size="xl" tone="primary">
            <ShoppingCart size={36} variant="Bulk" />
          </SoftAvatar>
        }
        title="Seu carrinho está vazio"
        description="Explore a vitrine e adicione os produtos que quiser."
        action={
          <Button component={RouterLink} to="/apps/loja/produtos" variant="contained">
            Ver produtos
          </Button>
        }
      />
    </Panel>
  );
}

/** Etapa 1: itens do carrinho com quantidade e remoção. */
export default function CartStep() {
  const { cart, products, setQty, removeFromCart, totals } = useStore();

  return (
    <Panel title={`Carrinho (${totals.itens} ${totals.itens === 1 ? 'item' : 'itens'})`} flush>
      <Stack divider={<Divider />}>
        {cart.map((item) => {
          const p = products.find((x) => x.id === item.productId)!;
          return (
            <Stack
              key={item.key}
              direction="row"
              sx={{ gap: 2, p: 2.5, alignItems: { sm: 'center' }, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}
            >
              <Box sx={{ width: 72, flexShrink: 0 }}>
                <ProductArt forma={p.forma} cor={item.cor} src={p.imagens?.[0]} alt={p.nome} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Link component={RouterLink} to={`/apps/loja/produtos/${p.id}`} underline="hover" color="text.primary" variant="subtitle1">
                  {p.nome}
                </Link>
                <Stack direction="row" sx={{ gap: 1, alignItems: 'center', mt: 0.5, color: 'text.secondary' }}>
                  <Swatch color={item.cor} size={12} />
                  <Typography variant="caption">
                    {COLORS[item.cor].nome}
                    {item.tamanho && ` · Tamanho ${item.tamanho}`}
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {brl.format(p.preco)} cada
                </Typography>
              </Box>
              <Stack direction="row" sx={{ gap: 2, alignItems: 'center', width: { xs: 1, sm: 'auto' }, justifyContent: 'space-between' }}>
                <QtyInput
                  size="small"
                  value={item.qtd}
                  max={Math.max(1, p.estoque)}
                  onChange={(v) => setQty(item.key, v)}
                  label={`Quantidade de ${p.nome}`}
                />
                <Typography variant="subtitle1" sx={{ minWidth: 100, textAlign: 'end' }}>
                  {brl.format(p.preco * item.qtd)}
                </Typography>
                <Tooltip title="Remover">
                  <IconButton
                    color="error"
                    aria-label={`Remover ${p.nome}`}
                    onClick={() => {
                      removeFromCart(item.key);
                      notify(`${p.nome} saiu do carrinho.`, 'info');
                    }}
                  >
                    <Trash size={18} />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
          );
        })}
      </Stack>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Button component={RouterLink} to="/apps/loja/produtos" startIcon={<ArrowLeft size={18} />} color="secondary">
          Continuar comprando
        </Button>
      </Box>
    </Panel>
  );
}
