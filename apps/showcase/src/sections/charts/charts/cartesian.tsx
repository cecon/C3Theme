import { useState } from 'react';

// material-ui
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';

// third-party
import { BarChart, BarPlot } from '@mui/x-charts/BarChart';
import { ChartsAxisHighlight } from '@mui/x-charts/ChartsAxisHighlight';
import { ChartsDataProvider } from '@mui/x-charts/ChartsDataProvider';
import { ChartsGrid } from '@mui/x-charts/ChartsGrid';
import { ChartsLegend } from '@mui/x-charts/ChartsLegend';
import { ChartsSurface } from '@mui/x-charts/ChartsSurface';
import { ChartsTooltip } from '@mui/x-charts/ChartsTooltip';
import { ChartsWrapper } from '@mui/x-charts/ChartsWrapper';
import { ChartsXAxis } from '@mui/x-charts/ChartsXAxis';
import { ChartsYAxis } from '@mui/x-charts/ChartsYAxis';
import { LineChart, lineClasses, LineHighlightPlot, LinePlot, MarkPlot } from '@mui/x-charts/LineChart';

import {
  DESPESA,
  DIAS,
  FAT_2025,
  FAT_2026,
  MESES,
  META_PEDIDOS,
  PEDIDOS,
  RECEITA,
  REGIOES,
  SEMANAS,
  TRIMESTRES,
  VENDAS_LOJA,
  VENDAS_ONLINE,
  VISITAS_APP,
  VISITAS_SITE
} from '../data';
import { brl, brlCompact, num, useSeriesColors } from '../palette';
import ChartPanel from './ChartPanel';

const HEIGHT = 300;
const mil = (v: number | null) => (v === null ? '' : brl.format(v * 1000));

export function AreaPanel() {
  const c = useSeriesColors();
  return (
    <ChartPanel
      title="Área"
      subtitle="Receita e despesa por mês"
      table={{ columns: ['Mês', 'Receita', 'Despesa'], rows: MESES.map((m, i) => [m, brl.format(RECEITA[i]), brl.format(DESPESA[i])]) }}
    >
      <LineChart
        height={HEIGHT}
        xAxis={[{ data: MESES, scaleType: 'point' }]}
        yAxis={[{ valueFormatter: (v: number) => brlCompact.format(v), width: 84 }]}
        series={[
          {
            label: 'Receita',
            data: RECEITA,
            area: true,
            showMark: false,
            color: c[0],
            curve: 'monotoneX',
            valueFormatter: (v) => brl.format(v ?? 0)
          },
          {
            label: 'Despesa',
            data: DESPESA,
            area: true,
            showMark: false,
            color: c[1],
            curve: 'monotoneX',
            valueFormatter: (v) => brl.format(v ?? 0)
          }
        ]}
        grid={{ horizontal: true }}
        sx={{ [`& .${lineClasses.area}`]: { fillOpacity: 0.16 } }}
      />
    </ChartPanel>
  );
}

export function BarPanel() {
  const c = useSeriesColors();
  const [stacked, setStacked] = useState(true);
  return (
    <ChartPanel
      title="Barras"
      subtitle="Vendas por região e canal (R$)"
      extra={
        <FormControlLabel
          control={<Switch size="small" checked={stacked} onChange={(e) => setStacked(e.target.checked)} />}
          label="Empilhar"
        />
      }
      table={{ columns: ['Região', 'Lojas', 'Online'], rows: REGIOES.map((r, i) => [r, mil(VENDAS_LOJA[i]), mil(VENDAS_ONLINE[i])]) }}
    >
      <BarChart
        height={HEIGHT}
        layout="horizontal"
        margin={{ right: 28 }}
        borderRadius={4}
        yAxis={[{ data: REGIOES, scaleType: 'band', width: 96 }]}
        xAxis={[{ valueFormatter: (v: number) => brlCompact.format(v * 1000) }]}
        series={[
          { label: 'Lojas', data: VENDAS_LOJA, color: c[0], stack: stacked ? 'total' : undefined, valueFormatter: mil },
          { label: 'Online', data: VENDAS_ONLINE, color: c[1], stack: stacked ? 'total' : undefined, valueFormatter: mil }
        ]}
        grid={{ vertical: true }}
      />
    </ChartPanel>
  );
}

export function ColumnPanel() {
  const c = useSeriesColors();
  return (
    <ChartPanel
      title="Colunas"
      subtitle="Faturamento por trimestre, 2025 x 2026"
      table={{ columns: ['Trimestre', '2025', '2026'], rows: TRIMESTRES.map((t, i) => [t, mil(FAT_2025[i]), mil(FAT_2026[i])]) }}
    >
      <BarChart
        height={HEIGHT}
        borderRadius={4}
        xAxis={[{ data: TRIMESTRES, scaleType: 'band' }]}
        yAxis={[{ valueFormatter: (v: number) => brlCompact.format(v * 1000), width: 84 }]}
        series={[
          { label: '2025', data: FAT_2025, color: c[0], valueFormatter: mil },
          { label: '2026', data: FAT_2026, color: c[1], valueFormatter: mil }
        ]}
        grid={{ horizontal: true }}
      />
    </ChartPanel>
  );
}

export function LinePanel() {
  const c = useSeriesColors();
  return (
    <ChartPanel
      title="Linhas"
      subtitle="Visitas diárias na primeira quinzena de outubro"
      table={{
        columns: ['Dia', 'Site', 'Aplicativo'],
        rows: DIAS.map((d, i) => [d, num.format(VISITAS_SITE[i]), num.format(VISITAS_APP[i])])
      }}
    >
      <LineChart
        height={HEIGHT}
        xAxis={[{ data: DIAS, scaleType: 'point' }]}
        yAxis={[{ valueFormatter: (v: number) => num.format(v), width: 56 }]}
        series={[
          { label: 'Site', data: VISITAS_SITE, color: c[0], valueFormatter: (v) => num.format(v ?? 0) },
          { label: 'Aplicativo', data: VISITAS_APP, color: c[1], valueFormatter: (v) => num.format(v ?? 0) }
        ]}
        grid={{ horizontal: true }}
      />
    </ChartPanel>
  );
}

/** Colunas de pedidos com a linha da meta, no mesmo eixo (mesma unidade). */
export function MixedPanel() {
  const c = useSeriesColors();
  return (
    <ChartPanel
      title="Misto"
      subtitle="Pedidos por semana e a meta"
      table={{
        columns: ['Semana', 'Pedidos', 'Meta'],
        rows: SEMANAS.map((s, i) => [s, num.format(PEDIDOS[i]), num.format(META_PEDIDOS[i])])
      }}
    >
      <ChartsDataProvider
        height={HEIGHT}
        xAxis={[{ id: 'x', data: SEMANAS, scaleType: 'band' }]}
        yAxis={[{ id: 'y', width: 48 }]}
        series={[
          { type: 'bar', label: 'Pedidos', data: PEDIDOS, color: c[0] },
          { type: 'line', label: 'Meta', data: META_PEDIDOS, color: c[1], curve: 'linear' }
        ]}
      >
        <ChartsWrapper>
          <ChartsLegend />
          <ChartsSurface>
            <ChartsGrid horizontal />
            <BarPlot borderRadius={4} />
            <LinePlot />
            <MarkPlot />
            <LineHighlightPlot />
            <ChartsAxisHighlight x="band" />
            <ChartsXAxis axisId="x" />
            <ChartsYAxis axisId="y" />
          </ChartsSurface>
          <ChartsTooltip trigger="axis" />
        </ChartsWrapper>
      </ChartsDataProvider>
    </ChartPanel>
  );
}
