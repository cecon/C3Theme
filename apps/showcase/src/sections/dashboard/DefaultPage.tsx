// material-ui
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';

import { TotalIncomeCard } from '../widgets/charts/DonutCards';
import ProjectOverviewCard from '../widgets/charts/ProjectOverviewCard';
import RepeatCustomerCard from '../widgets/charts/RepeatCustomerCard';
import SalesReportCard from '../widgets/charts/SalesReportCard';
import { TransactionsCard } from '../widgets/data/FinanceWidgets';
import { ProjectsTable } from '../widgets/data/TableWidgets';
import { UserActivityCard } from '../widgets/data/PeopleWidgets';
import { equalHeights } from '../widgets/kit/equalHeights';
import KpiRow from '../widgets/kit/KpiRow';
import { TeamAccessCard } from '../widgets/statistics/AccountCards';
import ReleaseCard from './ReleaseCard';
import WelcomeBanner from './WelcomeBanner';

/** Painel padrão: boas-vindas, KPIs de vendas, projetos e finanças. É a página inicial da vitrine. */
export default function DefaultPage() {
  return (
    <Grid container spacing={3} sx={equalHeights}>
      <Grid size={12}>
        <WelcomeBanner />
      </Grid>

      <KpiRow />

      <Grid size={{ xs: 12, md: 8, lg: 9 }}>
        <Stack spacing={3}>
          <RepeatCustomerCard />
          <ProjectOverviewCard />
        </Stack>
      </Grid>
      <Grid size={{ xs: 12, md: 4, lg: 3 }}>
        <Stack spacing={3}>
          <ReleaseCard />
          <TeamAccessCard />
        </Stack>
      </Grid>

      <Grid size={{ xs: 12, lg: 8 }}>
        <SalesReportCard />
      </Grid>
      <Grid size={{ xs: 12, lg: 4 }}>
        <UserActivityCard />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <TransactionsCard />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TotalIncomeCard />
      </Grid>

      <Grid size={12}>
        <ProjectsTable />
      </Grid>
    </Grid>
  );
}
