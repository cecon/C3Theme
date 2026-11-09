import { useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Step from '@mui/material/Step';
import StepButton from '@mui/material/StepButton';
import Stepper from '@mui/material/Stepper';
import Typography from '@mui/material/Typography';

// third-party
import { format } from 'date-fns';

import { Panel } from '@c3theme/ui';
import AddressStep, { addressLines } from './checkout/AddressStep';
import CartStep, { EmptyCart } from './checkout/CartStep';
import OrderDone, { PlacedOrder } from './checkout/OrderDone';
import OrderSummary from './checkout/OrderSummary';
import PaymentStep, { PaymentMethod } from './checkout/PaymentStep';
import { useStore } from './store';

const STEPS = ['Carrinho', 'Entrega', 'Pagamento'];

export default function CheckoutPage() {
  const { cart, addresses, totals, shipping, clearCart } = useStore();
  const [step, setStep] = useState(0);
  const [addressId, setAddressId] = useState<number | undefined>(addresses[0]?.id);
  const [method, setMethod] = useState<PaymentMethod>('cartao');
  const [order, setOrder] = useState<PlacedOrder>();
  const address = addresses.find((a) => a.id === addressId);

  if (order) return <OrderDone order={order} />;
  if (cart.length === 0) return <EmptyCart />;

  // só deixa pular para etapas cujo pré-requisito já está ok
  const canReach = (i: number) => i === 0 || (i === 1 && cart.length > 0) || (i === 2 && !!address);

  function place(pagamento: string) {
    const data = new Date();
    setOrder({ numero: `#C3-${format(data, 'yyMMdd-HHmm')}`, data, totals, pagamento, endereco: address!, entrega: shipping });
    clearCart();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const next = (
    <Button
      fullWidth
      variant="contained"
      size="large"
      disabled={step === 1 && !address}
      onClick={() => {
        setStep((s) => s + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }}
      sx={{ mt: 1 }}
    >
      {step === 0 ? 'Ir para a entrega' : 'Ir para o pagamento'}
    </Button>
  );

  return (
    <Stack sx={{ gap: 3 }}>
      <Panel>
        <Stepper nonLinear activeStep={step} alternativeLabel>
          {STEPS.map((label, i) => (
            <Step key={label} completed={i < step}>
              <StepButton onClick={() => setStep(i)} disabled={!canReach(i)}>
                {label}
              </StepButton>
            </Step>
          ))}
        </Stepper>
      </Panel>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          {step === 0 && <CartStep />}
          {step === 1 && <AddressStep selected={addressId} onSelect={setAddressId} />}
          {step === 2 && <PaymentStep method={method} onMethod={setMethod} onBack={() => setStep(1)} onPay={place} />}
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack sx={{ gap: 3, position: { md: 'sticky' }, top: { md: 88 } }}>
            <OrderSummary withCoupon={step === 0} action={step < 2 ? next : undefined} />
            {step === 2 && address && (
              <Panel
                title="Entregar em"
                action={
                  <Button size="small" onClick={() => setStep(1)}>
                    Alterar
                  </Button>
                }
              >
                <Typography variant="subtitle2">{address.destinatario}</Typography>
                {addressLines(address).map((l) => (
                  <Typography key={l} variant="body2" color="text.secondary">
                    {l}
                  </Typography>
                ))}
              </Panel>
            )}
            {step === 1 && !address && (
              <Box sx={{ px: 1 }}>
                <Typography variant="caption" color="warning.main">
                  Escolha ou cadastre um endereço para continuar.
                </Typography>
              </Box>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
