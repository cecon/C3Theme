// material-ui
import Grid from '@mui/material/Grid';

// third-party
import { ReceiptText, ShoppingCart, TaskSquare, Wallet3 } from 'iconsax-reactjs';

import { KPI_CANCEL, KPI_ORDERS, KPI_REVENUE, KPI_TICKET } from '../data';
import KpiCard from './KpiCard';

/** Linha com os quatro KPIs de vendas (usada nos painéis e nos widgets). */
export default function KpiRow() {
  const size = { xs: 12, sm: 6, lg: 3 } as const;
  return (
    <>
      <Grid size={size}>
        <KpiCard title="Receita" icon={Wallet3} data={KPI_REVENUE} tone="primary" />
      </Grid>
      <Grid size={size}>
        <KpiCard title="Pedidos" icon={ShoppingCart} data={KPI_ORDERS} tone="warning" chart="bar" />
      </Grid>
      <Grid size={size}>
        <KpiCard title="Ticket médio" icon={ReceiptText} data={KPI_TICKET} tone="success" />
      </Grid>
      <Grid size={size}>
        <KpiCard title="Cancelamentos" icon={TaskSquare} data={KPI_CANCEL} tone="error" chart="bar" invert />
      </Grid>
    </>
  );
}
