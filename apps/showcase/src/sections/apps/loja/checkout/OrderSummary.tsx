import { FormEvent, ReactNode, useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

// third-party
import { CloseCircle, TicketDiscount } from 'iconsax-reactjs';

import { notify, Panel } from '@c3theme/ui';
import { brl, COUPONS, FREE_SHIPPING_FROM, SHIPPING } from '../data';
import { useStore } from '../store';

function Line({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: 'success' }) {
  return (
    <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 2 }}>
      <Typography variant={strong ? 'subtitle1' : 'body2'} color={strong ? 'text.primary' : 'text.secondary'}>
        {label}
      </Typography>
      <Typography
        variant={strong ? 'h5' : 'body2'}
        color={tone === 'success' ? 'success.main' : 'text.primary'}
        sx={{ fontWeight: strong ? 700 : 500 }}
      >
        {value}
      </Typography>
    </Stack>
  );
}

function CouponBox() {
  const { coupon, applyCoupon, removeCoupon } = useStore();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!code.trim()) return setError('Digite um código.');
    const err = applyCoupon(code);
    setError(err);
    if (!err) {
      notify('Cupom aplicado.');
      setCode('');
    }
  }

  if (coupon)
    return (
      <Stack
        direction="row"
        sx={(t) => ({
          gap: 1.5,
          alignItems: 'center',
          p: 1.5,
          borderRadius: 2,
          bgcolor: `rgb(${t.vars.palette.success.mainChannel} / 0.1)`
        })}
      >
        <Box sx={{ color: 'success.main', display: 'flex' }}>
          <TicketDiscount size={22} variant="Bulk" />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2">{coupon.codigo}</Typography>
          <Typography variant="caption" color="text.secondary">
            {coupon.descricao}
          </Typography>
        </Box>
        <IconButton size="small" aria-label="Remover cupom" onClick={removeCoupon}>
          <CloseCircle size={18} />
        </IconButton>
      </Stack>
    );

  return (
    <Box component="form" onSubmit={submit} noValidate>
      <Stack direction="row" sx={{ gap: 1, alignItems: 'flex-start' }}>
        <TextField
          size="small"
          label="Cupom de desconto"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError(undefined);
          }}
          error={!!error}
          helperText={error}
          fullWidth
        />
        <Button type="submit" variant="outlined" sx={{ flexShrink: 0, height: 40 }}>
          Aplicar
        </Button>
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
        Experimente: {COUPONS.map((c) => c.codigo).join(', ')}
      </Typography>
    </Box>
  );
}

/** Resumo de valores do pedido. Na etapa do carrinho mostra também o campo de cupom. */
export default function OrderSummary({ withCoupon, action }: { withCoupon?: boolean; action?: ReactNode }) {
  const { totals, shipping, coupon } = useStore();
  const missing = FREE_SHIPPING_FROM - totals.subtotal;

  return (
    <Panel title="Resumo do pedido">
      <Stack sx={{ gap: 1.5 }}>
        {withCoupon && (
          <>
            <CouponBox />
            <Divider />
          </>
        )}
        <Line label={`Subtotal (${totals.itens} ${totals.itens === 1 ? 'item' : 'itens'})`} value={brl.format(totals.subtotal)} />
        {totals.desconto > 0 && (
          <Line label={`Desconto${coupon ? ` (${coupon.codigo})` : ''}`} value={`− ${brl.format(totals.desconto)}`} tone="success" />
        )}
        <Line
          label={SHIPPING[shipping].nome}
          value={totals.frete ? brl.format(totals.frete) : 'Grátis'}
          tone={totals.frete ? undefined : 'success'}
        />
        {shipping === 'padrao' && totals.frete > 0 && missing > 0 && (
          <Typography variant="caption" color="text.secondary">
            Faltam {brl.format(missing)} para o frete padrão sair de graça.
          </Typography>
        )}
        <Divider />
        <Line label="Total" value={brl.format(totals.total)} strong />
        {action}
      </Stack>
    </Panel>
  );
}
