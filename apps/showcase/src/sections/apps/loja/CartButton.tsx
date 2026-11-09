import { useNavigate } from 'react-router';

// material-ui
import Badge from '@mui/material/Badge';
import Button from '@mui/material/Button';

// third-party
import { ShoppingCart } from 'iconsax-reactjs';

import { brl } from './data';
import { useStore } from './store';

/** Botão do carrinho com a quantidade de itens; leva ao checkout. */
export default function CartButton() {
  const navigate = useNavigate();
  const { totals } = useStore();
  return (
    <Button
      variant="contained"
      onClick={() => navigate('/apps/loja/checkout')}
      aria-label={`Carrinho com ${totals.itens} ${totals.itens === 1 ? 'item' : 'itens'}`}
      startIcon={
        <Badge badgeContent={totals.itens} color="error" max={99} sx={{ '& .MuiBadge-badge': { border: 2, borderColor: 'primary.main' } }}>
          <ShoppingCart size={20} />
        </Badge>
      }
      sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
    >
      {totals.itens ? brl.format(totals.subtotal) : 'Carrinho'}
    </Button>
  );
}
