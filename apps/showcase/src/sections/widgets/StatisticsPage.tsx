// material-ui
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';

// third-party
import {
  Apple,
  Calendar,
  Chart,
  Clock,
  DocumentDownload,
  DocumentText,
  DollarCircle,
  Eye,
  Facebook,
  Gps,
  Instagram,
  People,
  Profile2User,
  ShoppingCart,
  TaskSquare,
  UserTick,
  Youtube
} from 'iconsax-reactjs';

import { equalHeights } from './kit/equalHeights';
import KpiRow from './kit/KpiRow';
import { BalanceCard, NoticeCard, StorageCard, TeamAccessCard, UpgradeCard } from './statistics/AccountCards';
import { GrowthStatCard, HighlightStatCard, RoundIconStatCard, SocialStatCard, StatTile, UserCountCard } from './statistics/StatCards';
import WalletCard from './statistics/WalletCard';

const quarter = { xs: 12, sm: 6, lg: 3 } as const;
const third = { xs: 12, sm: 6, lg: 4 } as const;

/** Todos os tipos de cartão de número e KPI. */
export default function StatisticsPage() {
  return (
    <Grid container spacing={3} sx={equalHeights}>
      <Grid size={quarter}>
        <StatTile label="Faturamento" value="R$ 302 mil" icon={Chart} tone="primary" updated="Atualizado às 14:20" />
      </Grid>
      <Grid size={quarter}>
        <StatTile label="Tarefas abertas" value="145" icon={Calendar} tone="error" updated="Atualizado há 5 min" />
      </Grid>
      <Grid size={quarter}>
        <StatTile label="Visualizações" value="2.940" icon={DocumentText} tone="success" updated="Atualizado há 1 h" />
      </Grid>
      <Grid size={quarter}>
        <StatTile label="Downloads" value="518" icon={DocumentDownload} tone="info" updated="Atualizado ontem" />
      </Grid>

      <Grid size={quarter}>
        <SocialStatCard label="Seguidores no Instagram" value="12,4 mil" icon={Instagram} tone="secondary" />
      </Grid>
      <Grid size={quarter}>
        <SocialStatCard label="Curtidas no Facebook" value="8.230" icon={Facebook} tone="primary" />
      </Grid>
      <Grid size={quarter}>
        <SocialStatCard label="Usuários no iOS" value="3.915" icon={Apple} tone="info" />
      </Grid>
      <Grid size={quarter}>
        <SocialStatCard label="Vídeos no YouTube" value="642" icon={Youtube} tone="error" />
      </Grid>

      <Grid size={quarter}>
        <GrowthStatCard label="Visualizações de página" value="442.236" change={59.3} extra="35 mil visitas" />
      </Grid>
      <Grid size={quarter}>
        <GrowthStatCard label="Usuários ativos" value="78.250" change={70.5} extra="8.900 usuários" />
      </Grid>
      <Grid size={quarter}>
        <GrowthStatCard label="Pedidos" value="18.800" change={-27.4} extra="1.943 pedidos" />
      </Grid>
      <Grid size={quarter}>
        <GrowthStatCard label="Vendas" value="R$ 350.780" change={-12.6} extra="R$ 20.395" />
      </Grid>

      <KpiRow />

      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <WalletCard />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <Stack spacing={3}>
          <TeamAccessCard />
          <UpgradeCard />
          <NoticeCard />
        </Stack>
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <Stack spacing={3}>
          <StorageCard />
          <BalanceCard />
          <UserCountCard label="Clientes verificados" value="1.284" icon={UserTick} tone="success" />
        </Stack>
      </Grid>

      <Grid size={third}>
        <HighlightStatCard label="Receita" value="R$ 45.200" icon={DollarCircle} tone="primary" note="R$ 50.032 no mês passado" />
      </Grid>
      <Grid size={third}>
        <HighlightStatCard label="Pedidos recebidos" value="486" icon={ShoppingCart} tone="warning" note="20% a mais que ontem" />
      </Grid>
      <Grid size={{ xs: 12, lg: 4 }}>
        <HighlightStatCard label="Vendas concluídas" value="1.641" icon={TaskSquare} tone="success" note="R$ 105.500 em receita gerada" />
      </Grid>

      <Grid size={third}>
        <RoundIconStatCard label="Impressões" value="1.563" icon={Eye} tone="primary" range="23 mai – 1 jun 2026" />
      </Grid>
      <Grid size={third}>
        <RoundIconStatCard label="Meta de leads" value="30.564" icon={Gps} tone="success" range="28 mai – 1 jun 2026" />
      </Grid>
      <Grid size={{ xs: 12, lg: 4 }}>
        <RoundIconStatCard label="Tempo médio de sessão" value="4m 26s" icon={Clock} tone="warning" range="30 mai – 1 jun 2026" />
      </Grid>

      <Grid size={third}>
        <UserCountCard label="Usuários cadastrados" value="12.480" icon={People} tone="primary" />
      </Grid>
      <Grid size={third}>
        <UserCountCard label="Equipes ativas" value="86" icon={Profile2User} tone="info" />
      </Grid>
      <Grid size={{ xs: 12, lg: 4 }}>
        <UserCountCard label="Pedidos pendentes" value="37" icon={ShoppingCart} tone="error" />
      </Grid>
    </Grid>
  );
}
