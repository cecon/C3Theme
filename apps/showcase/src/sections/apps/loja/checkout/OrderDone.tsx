import { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { addBusinessDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TickCircle } from 'iconsax-reactjs';

import { Panel, SoftAvatar } from '@c3theme/ui';
import { Address, brl, SHIPPING, ShippingId } from '../data';
import type { Totals } from '../store';
import { addressLines } from './AddressStep';

export interface PlacedOrder {
  numero: string;
  data: Date;
  totals: Totals;
  pagamento: string;
  endereco: Address;
  entrega: ShippingId;
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box>
      <Typography variant="overline" color="text.secondary">
        {title}
      </Typography>
      {children}
    </Box>
  );
}

/** Pedido concluído: número, valores, pagamento e previsão de entrega. */
export default function OrderDone({ order }: { order: PlacedOrder }) {
  const [min, max] = order.entrega === 'expressa' ? [1, 2] : [5, 8];
  const previsao = `${format(addBusinessDays(order.data, min), "d 'de' MMM", { locale: ptBR })} a ${format(addBusinessDays(order.data, max), "d 'de' MMM", { locale: ptBR })}`;

  return (
    <Panel>
      <Stack sx={{ alignItems: 'center', textAlign: 'center', gap: 1.5, py: { xs: 2, sm: 4 }, maxWidth: 640, mx: 'auto' }}>
        <SoftAvatar tone="success" size="xl" sx={{ width: 88, height: 88 }}>
          <TickCircle size={48} variant="Bulk" />
        </SoftAvatar>
        <Typography variant="h3" component="h2">
          Pedido confirmado!
        </Typography>
        <Typography color="text.secondary">
          Obrigado pela compra. Enviamos os detalhes do pedido <b>{order.numero}</b> para o seu e-mail.
        </Typography>

        <Box sx={{ width: 1, mt: 2, p: { xs: 2, sm: 3 }, borderRadius: 3, border: 1, borderColor: 'divider', textAlign: 'start' }}>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Block title="Entrega">
                <Typography variant="subtitle2">{order.endereco.destinatario}</Typography>
                {addressLines(order.endereco).map((l) => (
                  <Typography key={l} variant="body2" color="text.secondary">
                    {l}
                  </Typography>
                ))}
              </Block>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Block title="Pagamento">
                <Typography variant="body2">{order.pagamento}</Typography>
              </Block>
              <Block title="Previsão">
                <Typography variant="body2">
                  {SHIPPING[order.entrega].nome}: {previsao}
                </Typography>
              </Block>
            </Grid>
          </Grid>
          <Divider sx={{ my: 2 }} />
          <Stack sx={{ gap: 0.5 }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Subtotal ({order.totals.itens} itens)
              </Typography>
              <Typography variant="body2">{brl.format(order.totals.subtotal)}</Typography>
            </Stack>
            {order.totals.desconto > 0 && (
              <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Desconto
                </Typography>
                <Typography variant="body2" color="success.main">
                  − {brl.format(order.totals.desconto)}
                </Typography>
              </Stack>
            )}
            <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Frete
              </Typography>
              <Typography variant="body2">{order.totals.frete ? brl.format(order.totals.frete) : 'Grátis'}</Typography>
            </Stack>
            <Stack direction="row" sx={{ justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="subtitle1">Total pago</Typography>
              <Typography variant="h5">{brl.format(order.totals.total)}</Typography>
            </Stack>
          </Stack>
        </Box>

        <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1.5, mt: 2, width: { xs: 1, sm: 'auto' } }}>
          <Button component={RouterLink} to="/apps/loja/produtos" variant="contained">
            Continuar comprando
          </Button>
          <Button component={RouterLink} to="/apps/loja/lista" variant="outlined" color="secondary">
            Ir para o catálogo
          </Button>
        </Stack>
      </Stack>
    </Panel>
  );
}
