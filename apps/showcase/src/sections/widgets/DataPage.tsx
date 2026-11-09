// material-ui
import Grid from '@mui/material/Grid';

import AgendaCard from './data/AgendaCard';
import { ActivityFeedCard, IncomingRequestsCard, LatestMessagesCard, LatestPostsCard } from './data/FeedWidgets';
import { InvestmentsCard, PaymentHistoryCard, TrafficSourcesCard, TransactionsCard } from './data/FinanceWidgets';
import { ContactsCard, JobCard, NewCustomersCard, TeamMembersCard, UserActivityCard } from './data/PeopleWidgets';
import {
  ActiveTicketsTable,
  AppSalesTable,
  CustomersByStateTable,
  LastSalesTable,
  LatestOrdersTable,
  MonthlyRevenueTable,
  ProductsTable,
  ProjectsTable,
  RecentTicketsTable
} from './data/TableWidgets';
import { AddTaskCard, DeliveriesCard, MyTasksCard, TodoListCard } from './data/TaskWidgets';
import { equalHeights } from './kit/equalHeights';

const third = { xs: 12, md: 6, lg: 4 } as const;

/** Widgets de dados: listas, feeds, tabelas pequenas, agenda e contatos. */
export default function DataPage() {
  return (
    <Grid container spacing={3} sx={equalHeights}>
      <Grid size={third}>
        <MyTasksCard />
      </Grid>
      <Grid size={third}>
        <JobCard />
      </Grid>
      <Grid size={{ xs: 12, lg: 4 }}>
        <TeamMembersCard />
      </Grid>

      <Grid size={{ xs: 12, lg: 8 }}>
        <ProductsTable />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <MonthlyRevenueTable />
      </Grid>

      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <NewCustomersCard />
      </Grid>
      <Grid size={{ xs: 12, lg: 8 }}>
        <RecentTicketsTable />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <TransactionsCard />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <PaymentHistoryCard />
      </Grid>

      <Grid size={third}>
        <AddTaskCard />
      </Grid>
      <Grid size={third}>
        <TodoListCard />
      </Grid>
      <Grid size={{ xs: 12, lg: 4 }}>
        <TrafficSourcesCard />
      </Grid>

      <Grid size={third}>
        <IncomingRequestsCard />
      </Grid>
      <Grid size={third}>
        <InvestmentsCard />
      </Grid>
      <Grid size={{ xs: 12, lg: 4 }}>
        <DeliveriesCard />
      </Grid>

      <Grid size={{ xs: 12, lg: 8 }}>
        <AppSalesTable />
      </Grid>
      <Grid size={{ xs: 12, lg: 4 }}>
        <LatestPostsCard />
      </Grid>

      <Grid size={third}>
        <AgendaCard />
      </Grid>
      <Grid size={third}>
        <ContactsCard />
      </Grid>
      <Grid size={{ xs: 12, lg: 4 }}>
        <LatestMessagesCard />
      </Grid>

      <Grid size={{ xs: 12, lg: 7 }}>
        <UserActivityCard />
      </Grid>
      <Grid size={{ xs: 12, lg: 5 }}>
        <ActivityFeedCard />
      </Grid>

      <Grid size={{ xs: 12, lg: 7 }}>
        <ProjectsTable />
      </Grid>
      <Grid size={{ xs: 12, lg: 5 }}>
        <LastSalesTable />
      </Grid>

      <Grid size={{ xs: 12, lg: 6 }}>
        <ActiveTicketsTable />
      </Grid>
      <Grid size={{ xs: 12, lg: 6 }}>
        <CustomersByStateTable />
      </Grid>

      <Grid size={12}>
        <LatestOrdersTable />
      </Grid>
    </Grid>
  );
}
