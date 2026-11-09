// material-ui
import Box from '@mui/material/Box';

// third-party
import { ScatterChart } from '@mui/x-charts/ScatterChart';

import { Panel } from '@c3theme/ui';
import { CUSTOMER_SCATTER } from '../data';
import { chartSx, quietAxis } from '../kit/chartSx';
import { formatBRL } from '../kit/format';
import Legend from '../kit/Legend';
import { useChartColors } from '../kit/useChartColors';

/** Cada ponto é um cliente: quanto gasta por pedido e quantas vezes compra no mês. */
export default function CustomerScatterCard() {
  const colors = useChartColors();
  const fmt = (v: { x: number; y: number }) => `${formatBRL(v.x, true)} · ${v.y} pedidos/mês`;
  return (
    <Panel title="Perfil de clientes" subtitle="Ticket médio × frequência">
      <Legend
        items={[
          { label: 'Varejo', tone: 'primary' },
          { label: 'Atacado', tone: 'success' }
        ]}
      />
      <Box sx={chartSx}>
        <ScatterChart
          height={300}
          margin={{ left: 0, right: 8, top: 16, bottom: 0 }}
          xAxis={[{ ...quietAxis, valueFormatter: (v: number) => `R$ ${v}` }]}
          yAxis={[{ width: 32, ...quietAxis }]}
          series={[
            { data: CUSTOMER_SCATTER.varejo, label: 'Varejo', color: colors.primary, valueFormatter: fmt },
            { data: CUSTOMER_SCATTER.atacado, label: 'Atacado', color: colors.success, valueFormatter: fmt }
          ]}
          grid={{ horizontal: true, vertical: true }}
          hideLegend
        />
      </Box>
    </Panel>
  );
}
