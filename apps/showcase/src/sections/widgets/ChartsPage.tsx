// material-ui
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';

import { METRIC_CARDS } from './data';
import AcquisitionChannelsCard from './charts/AcquisitionChannelsCard';
import CategorySalesCard from './charts/CategorySalesCard';
import CustomerScatterCard from './charts/CustomerScatterCard';
import { IncomeByChannelCard, TotalIncomeCard } from './charts/DonutCards';
import IncomeOverviewCard from './charts/IncomeOverviewCard';
import LanguagesCard from './charts/LanguagesCard';
import MetricChartCard from './charts/MetricChartCard';
import MonthlyReportCard from './charts/MonthlyReportCard';
import ProjectAnalyticsCard from './charts/ProjectAnalyticsCard';
import ProjectOverviewCard from './charts/ProjectOverviewCard';
import RadialGoalCard from './charts/RadialGoalCard';
import RepeatCustomerCard from './charts/RepeatCustomerCard';
import SalesReportCard from './charts/SalesReportCard';
import TeamRadarCard from './charts/TeamRadarCard';
import { equalHeights } from './kit/equalHeights';
import KpiRow from './kit/KpiRow';

/** Cartões com gráficos: área, barras, rosca, anel, radar e dispersão. */
export default function ChartsPage() {
  return (
    <Grid container spacing={3} sx={equalHeights}>
      <KpiRow />

      <Grid size={{ xs: 12, md: 8, lg: 9 }}>
        <Stack spacing={3}>
          <RepeatCustomerCard />
          <ProjectOverviewCard />
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, lg: 6 }}>
              <IncomeByChannelCard />
            </Grid>
            <Grid size={{ xs: 12, lg: 6 }}>
              <Stack spacing={3}>
                <RadialGoalCard
                  title="Meta de faturamento"
                  amount="R$ 214.900"
                  percent={72}
                  caption="de R$ 300 mil no mês"
                  tone="primary"
                />
                <RadialGoalCard
                  title="Orçamento de marketing"
                  amount="R$ 38.400"
                  percent={91}
                  caption="de R$ 42 mil liberados"
                  tone="error"
                />
                <RadialGoalCard title="Satisfação (NPS)" amount="68 pontos" percent={68} caption="meta: 75 pontos" tone="success" />
              </Stack>
            </Grid>
          </Grid>
        </Stack>
      </Grid>
      <Grid size={{ xs: 12, md: 4, lg: 3 }}>
        <Stack spacing={3}>
          <MetricChartCard
            title="Novos pedidos"
            chart="gauge"
            percent={METRIC_CARDS.orders}
            caption="da meta"
            change={{ dia: 4.1, semana: 6.3, mes: -2.2, ano: 9.8 }}
          />
          <MetricChartCard
            title="Novos usuários"
            chart="bar"
            series={METRIC_CARDS.users}
            unit="cadastros"
            tone="info"
            change={{ dia: -1.4, semana: 3.2, mes: 8.5, ano: 22.1 }}
          />
          <MetricChartCard
            title="Visitantes"
            chart="line"
            series={METRIC_CARDS.visitors}
            unit="visitas"
            tone="success"
            change={{ dia: 2.2, semana: -0.8, mes: 5.4, ano: 15.6 }}
          />
        </Stack>
      </Grid>

      <Grid size={12}>
        <ProjectAnalyticsCard />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <CategorySalesCard />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TotalIncomeCard />
      </Grid>

      <Grid size={{ xs: 12, md: 5, lg: 4 }}>
        <LanguagesCard />
      </Grid>
      <Grid size={{ xs: 12, md: 7, lg: 8 }}>
        <MonthlyReportCard />
      </Grid>

      <Grid size={{ xs: 12, md: 7, lg: 8 }}>
        <SalesReportCard />
      </Grid>
      <Grid size={{ xs: 12, md: 5, lg: 4 }}>
        <AcquisitionChannelsCard />
      </Grid>

      <Grid size={{ xs: 12, lg: 8 }}>
        <IncomeOverviewCard />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <TeamRadarCard />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 12 }}>
        <CustomerScatterCard />
      </Grid>
    </Grid>
  );
}
