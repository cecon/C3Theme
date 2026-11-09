// material-ui
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

// third-party
import { Gauge, gaugeClasses } from '@mui/x-charts/Gauge';
import { PieChart, pieClasses } from '@mui/x-charts/PieChart';
import { RadarChart, radarClasses } from '@mui/x-charts/RadarChart';

import { CANAIS, CRITERIOS, LOJA_PAULISTA, LOJA_SAVASSI, METAS, PAGAMENTOS } from '../data';
import { num, useSeriesColors } from '../palette';
import ChartPanel from './ChartPanel';

const HEIGHT = 260;
const total = (list: { value: number }[]) => list.reduce((s, i) => s + i.value, 0);

export function PiePanel() {
  const c = useSeriesColors();
  const totalPag = total(PAGAMENTOS);
  return (
    <ChartPanel
      title="Pizza e rosca"
      subtitle="Vendas por canal (%) e pedidos por forma de pagamento"
      table={{
        columns: ['Item', 'Valor'],
        rows: [...CANAIS.map((x) => [x.label, `${x.value}%`]), ...PAGAMENTOS.map((x) => [x.label, `${num.format(x.value)} pedidos`])]
      }}
    >
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <PieChart
            height={HEIGHT}
            series={[
              {
                data: CANAIS.map((x, i) => ({ ...x, color: c[i] })),
                arcLabel: (x) => `${x.value}%`,
                arcLabelMinAngle: 25,
                paddingAngle: 1,
                cornerRadius: 4,
                valueFormatter: (x) => `${x.value}%`,
                highlightScope: { fade: 'global', highlight: 'item' }
              }
            ]}
            slotProps={{ legend: { direction: 'horizontal', position: { vertical: 'bottom', horizontal: 'center' } } }}
            sx={(theme) => ({ [`& .${pieClasses.arcLabel}`]: { fill: theme.vars.palette.common.white, fontWeight: 600, fontSize: 13 } })}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Box sx={{ position: 'relative' }}>
            <PieChart
              height={HEIGHT}
              series={[
                {
                  data: PAGAMENTOS.map((x, i) => ({ ...x, color: c[i] })),
                  innerRadius: '62%',
                  paddingAngle: 2,
                  cornerRadius: 4,
                  valueFormatter: (x) => `${num.format(x.value)} pedidos`,
                  highlightScope: { fade: 'global', highlight: 'item' }
                }
              ]}
              slotProps={{ legend: { direction: 'horizontal', position: { vertical: 'bottom', horizontal: 'center' } } }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            {num.format(totalPag)} pedidos no mês
          </Typography>
        </Grid>
      </Grid>
    </ChartPanel>
  );
}

export function RadarPanel() {
  const c = useSeriesColors();
  return (
    <ChartPanel
      title="Radar (polar)"
      subtitle="Avaliação média das lojas, de 0 a 10"
      table={{ columns: ['Critério', 'Paulista', 'Savassi'], rows: CRITERIOS.map((k, i) => [k, LOJA_PAULISTA[i], LOJA_SAVASSI[i]]) }}
    >
      <RadarChart
        height={HEIGHT + 40}
        radar={{ metrics: CRITERIOS, max: 10 }}
        margin={{ left: 48, right: 48 }}
        series={[
          { label: 'Loja Paulista (SP)', data: LOJA_PAULISTA, color: c[0], fillArea: true },
          { label: 'Loja Savassi (BH)', data: LOJA_SAVASSI, color: c[1], fillArea: true }
        ]}
        sx={{ [`& .${radarClasses.seriesArea}`]: { fillOpacity: 0.2 } }}
      />
    </ChartPanel>
  );
}

export function GaugePanel() {
  const c = useSeriesColors();
  return (
    <ChartPanel
      title="Radial"
      subtitle="Realizado em relação à meta do mês"
      table={{ columns: ['Meta', 'Realizado'], rows: [...METAS.map((m) => [m.label, `${m.valor}%`]), ['Ocupação do estoque', '71%']] }}
    >
      <Grid container spacing={1} sx={{ alignItems: 'center' }}>
        {METAS.map((m, i) => (
          <Grid key={m.label} size={{ xs: 4 }} sx={{ textAlign: 'center' }}>
            <Gauge
              height={140}
              value={m.valor}
              startAngle={-120}
              endAngle={120}
              innerRadius="76%"
              cornerRadius="50%"
              text={({ value }) => `${value}%`}
              aria-label={`${m.label}: ${m.valor}% da meta`}
              sx={(theme) => ({
                [`& .${gaugeClasses.valueText}`]: { fontSize: 20, fontWeight: 600 },
                [`& .${gaugeClasses.valueText} text`]: { fill: theme.vars.palette.text.primary },
                [`& .${gaugeClasses.valueArc}`]: { fill: c[i] },
                [`& .${gaugeClasses.referenceArc}`]: { fill: theme.vars.palette.action.hover }
              })}
            />
            <Typography variant="subtitle2">{m.label}</Typography>
          </Grid>
        ))}
      </Grid>
      <Box sx={{ mt: 3 }}>
        <Gauge
          height={150}
          value={71}
          startAngle={-90}
          endAngle={90}
          innerRadius="70%"
          text={({ value }) => `${value}%`}
          aria-label="Ocupação do estoque: 71%"
          sx={(theme) => ({
            [`& .${gaugeClasses.valueText}`]: { fontSize: 24, fontWeight: 600, transform: 'translate(0px, -12px)' },
            [`& .${gaugeClasses.valueText} text`]: { fill: theme.vars.palette.text.primary },
            [`& .${gaugeClasses.valueArc}`]: { fill: c[2] },
            [`& .${gaugeClasses.referenceArc}`]: { fill: theme.vars.palette.action.hover }
          })}
        />
        <Typography variant="subtitle2" sx={{ textAlign: 'center' }}>
          Ocupação do estoque
        </Typography>
      </Box>
    </ChartPanel>
  );
}
