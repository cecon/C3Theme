import { useState } from 'react';

// material-ui
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { ArrowDown2 } from 'iconsax-reactjs';

import { Panel } from '@c3theme/ui';
import BillingToggle from './BillingToggle';
import PlanCards from './PlanCards';
import { Billing } from './planos';

const FAQ = [
  ['Posso trocar de plano depois?', 'Pode, a qualquer momento. A diferença é calculada proporcionalmente aos dias que faltam no ciclo.'],
  ['Tem fidelidade?', 'No mensal, não: cancele quando quiser. No anual, o valor é pago de uma vez com 20% de desconto.'],
  ['Quais formas de pagamento?', 'Cartão de crédito, Pix e boleto. Empresas no plano Empresarial também podem pagar por nota fiscal.'],
  ['Existe período de teste?', 'Sim, 14 dias grátis em qualquer plano, sem pedir cartão.']
];

/** Preços, versão 1: cartões lado a lado e perguntas frequentes. */
export default function PricingPage() {
  const [billing, setBilling] = useState<Billing>('mensal');
  return (
    <Stack spacing={4}>
      <Box sx={{ textAlign: 'center', maxWidth: 640, mx: 'auto' }}>
        <Typography variant="h2">Um plano para cada fase da empresa</Typography>
        <Typography color="text.secondary" sx={{ mt: 1.5, mb: 3 }}>
          Comece pequeno e cresça sem trocar de sistema. Todos os planos têm 14 dias grátis.
        </Typography>
        <BillingToggle value={billing} onChange={setBilling} />
      </Box>
      <PlanCards billing={billing} />
      <Panel title="Perguntas frequentes" flush>
        {FAQ.map(([q, a]) => (
          <Accordion
            key={q}
            disableGutters
            elevation={0}
            square
            sx={{ '&:before': { display: 'none' }, borderBottom: 1, borderColor: 'divider', '&:last-of-type': { borderBottom: 0 } }}
          >
            <AccordionSummary expandIcon={<ArrowDown2 size={16} />} sx={{ px: 2.5 }}>
              <Typography variant="subtitle1">{q}</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 2.5, pt: 0 }}>
              <Typography color="text.secondary">{a}</Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Panel>
    </Stack>
  );
}
