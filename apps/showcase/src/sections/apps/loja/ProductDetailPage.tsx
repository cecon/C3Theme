import { Link as RouterLink, useParams } from 'react-router';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import { ArrowLeft } from 'iconsax-reactjs';
import { MessagePage, Panel } from '@c3theme/ui';
import CartButton from './CartButton';
import { useStore } from './store';
import { ProductBody } from './detail/Details';

export default function ProductDetailPage() {
  const { id } = useParams();
  const { products } = useStore();
  const product = products.find((p) => p.id === Number(id));

  return (
    <Stack sx={{ gap: 3 }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
        <Link component={RouterLink} to="/apps/loja/produtos" underline="hover" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ArrowLeft size={18} />
          Voltar à vitrine
        </Link>
        <CartButton />
      </Stack>
      {product ? (
        // a chave zera cor, tamanho e avaliações ao trocar de produto
        <ProductBody key={product.id} product={product} />
      ) : (
        <Panel>
          <MessagePage
            title="Produto não encontrado"
            description="Ele pode ter sido removido do catálogo."
            action={
              <Button component={RouterLink} to="/apps/loja/produtos" variant="contained">
                Ver produtos
              </Button>
            }
          />
        </Panel>
      )}
    </Stack>
  );
}
