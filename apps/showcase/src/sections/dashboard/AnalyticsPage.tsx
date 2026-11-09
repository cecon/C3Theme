// material-ui
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';

import AcquisitionChannelsCard from '../widgets/charts/AcquisitionChannelsCard';
import CategorySalesCard from '../widgets/charts/CategorySalesCard';
import { IncomeByChannelCard } from '../widgets/charts/DonutCards';
import IncomeOverviewCard from '../widgets/charts/IncomeOverviewCard';
import LanguagesCard from '../widgets/charts/LanguagesCard';
import MetricChartCard from '../widgets/charts/MetricChartCard';
import ProjectAnalyticsCard from '../widgets/charts/ProjectAnalyticsCard';
import RadialGoalCard from '../widgets/charts/RadialGoalCard';
import { METRIC_CARDS } from '../widgets/data';
import { PaymentHistoryCard } from '../widgets/data/FinanceWidgets';
import { equalHeights } from '../widgets/kit/equalHeights';
import { BalanceCard, StorageCard } from '../widgets/statistics/AccountCards';

/** Painel analítico: métricas com período, comparação anual, receita por canal e aquisição. */
export default function AnalyticsPage() {
  const quarter = { xs: 12, sm: 6, lg: 3 } as const;
  return (
    <Grid container spacing={3} sx={equalHeights}>
      <Grid size={quarter}>
        <MetricChartCard
          title="Novos pedidos"
          chart="gauge"
          percent={METRIC_CARDS.orders}
          caption="da meta"
          change={{ dia: 4.1, semana: 6.3, mes: -2.2, ano: 9.8 }}
        />
      </Grid>
      <Grid size={quarter}>
        <MetricChartCard
          title="Novos usuários"
          chart="bar"
          series={METRIC_CARDS.users}
          unit="cadastros"
          tone="info"
          change={{ dia: -1.4, semana: 3.2, mes: 8.5, ano: 22.1 }}
        />
      </Grid>
      <Grid size={quarter}>
        <MetricChartCard
          title="Visitantes"
          chart="line"
          series={METRIC_CARDS.visitors}
          unit="visitas"
          tone="success"
          change={{ dia: 2.2, semana: -0.8, mes: 5.4, ano: 15.6 }}
        />
      </Grid>
      <Grid size={quarter}>
        <Stack spacing={3}>
          <StorageCard />
          <BalanceCard />
        </Stack>
      </Grid>

      <Grid size={12}>
        <ProjectAnalyticsCard />
      </Grid>

      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <IncomeByChannelCard />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <CategorySalesCard />
      </Grid>
      <Grid size={{ xs: 12, lg: 4 }}>
        <PaymentHistoryCard />
      </Grid>

      <Grid size={{ xs: 12, lg: 4 }}>
        <Stack spacing={3}>
          <RadialGoalCard title="Meta de faturamento" amount="R$ 214.900" percent={72} caption="de R$ 300 mil no mês" tone="primary" />
          <RadialGoalCard title="Orçamento de marketing" amount="R$ 38.400" percent={91} caption="de R$ 42 mil liberados" tone="error" />
          <RadialGoalCard title="Satisfação (NPS)" amount="68 pontos" percent={68} caption="meta: 75 pontos" tone="success" />
        </Stack>
      </Grid>
      <Grid size={{ xs: 12, lg: 8 }}>
        <IncomeOverviewCard />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <AcquisitionChannelsCard />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <LanguagesCard />
      </Grid>
    </Grid>
  );
}
