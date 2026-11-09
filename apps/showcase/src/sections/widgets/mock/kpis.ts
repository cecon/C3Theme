// Geradores determinísticos de série e os KPIs, carteira, equipe e armazenamento.
import type { KpiPoint } from '../kit/KpiCard';
import type { ByPeriod } from '../kit/period';
import type { ChartTone } from '../kit/useChartColors';

/** Série suave e repetível (sem Math.random), boa para mini-gráficos. */
export function wave(length: number, base: number, amplitude: number, seed = 1): number[] {
  return Array.from({ length }, (_, i) => {
    const v = base + amplitude * (Math.sin(i * 0.9 + seed) * 0.6 + Math.cos(i * 0.45 + seed * 2) * 0.4);
    return Math.round(v * 10) / 10;
  });
}

/** Número entre 0 e 1 que parece aleatório, mas é sempre o mesmo para (i, seed). */
export function noise(i: number, seed: number): number {
  const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const kpi = (value: string, change: number, base: number, amp: number, seed: number, length = 10): KpiPoint => ({
  value,
  change,
  points: wave(length, base, amp, seed)
});

// ---------------------------------------------------------------- KPIs com mini-gráfico

export const KPI_REVENUE: ByPeriod<KpiPoint> = {
  dia: kpi('R$ 8.420', 4.2, 40, 12, 1, 12),
  semana: kpi('R$ 51.380', 8.7, 60, 18, 2, 7),
  mes: kpi('R$ 214.900', 12.3, 80, 25, 3),
  ano: kpi('R$ 2,4 mi', 18.1, 120, 30, 4, 12)
};

export const KPI_ORDERS: ByPeriod<KpiPoint> = {
  dia: kpi('126', -3.1, 30, 8, 5, 12),
  semana: kpi('842', 2.4, 45, 12, 6, 7),
  mes: kpi('3.518', -1.8, 50, 14, 7),
  ano: kpi('41.260', 6.5, 70, 18, 8, 12)
};

export const KPI_TICKET: ByPeriod<KpiPoint> = {
  dia: kpi('R$ 66,80', 1.2, 20, 5, 9, 12),
  semana: kpi('R$ 61,02', 3.9, 25, 6, 10, 7),
  mes: kpi('R$ 61,09', 5.6, 30, 8, 11),
  ano: kpi('R$ 58,40', 2.2, 35, 9, 12, 12)
};

export const KPI_CANCEL: ByPeriod<KpiPoint> = {
  dia: kpi('2,1%', 0.4, 10, 3, 13, 12),
  semana: kpi('1,8%', -0.9, 12, 4, 14, 7),
  mes: kpi('1,6%', -2.3, 14, 4, 15),
  ano: kpi('1,9%', -1.1, 16, 5, 16, 12)
};

// ---------------------------------------------------------------- carteira, equipe, armazenamento

export interface PaymentCard {
  id: string;
  brand: string;
  last4: string;
  holder: string;
  active: boolean;
}

export const WALLET_CARDS: PaymentCard[] = [
  { id: 'c1', brand: 'Visa', last4: '4821', holder: 'Conta empresarial', active: true },
  { id: 'c2', brand: 'Mastercard', last4: '1093', holder: 'Viagens da equipe', active: true },
  { id: 'c3', brand: 'Elo', last4: '7756', holder: 'Assinaturas', active: false }
];

export const TEAM_ACCESS = [
  { name: 'Ana Ribeiro', initials: 'AR' },
  { name: 'Bruno Carvalho', initials: 'BC' },
  { name: 'Camila Duarte', initials: 'CD' },
  { name: 'Diego Moreira', initials: 'DM' },
  { name: 'Elisa Nogueira', initials: 'EN' },
  { name: 'Fábio Teixeira', initials: 'FT' },
  { name: 'Gabriela Lins', initials: 'GL' }
];

export const STORAGE_USAGE: { label: string; gb: number; tone: ChartTone }[] = [
  { label: 'Documentos', gb: 18.4, tone: 'primary' },
  { label: 'Imagens', gb: 12.1, tone: 'info' },
  { label: 'Vídeos', gb: 9.6, tone: 'warning' },
  { label: 'Outros', gb: 3.9, tone: 'secondary' }
];
export const STORAGE_TOTAL_GB = 64;

export const BALANCE_ACCOUNTS = [
  { label: 'Conta corrente', value: 18_430.9 },
  { label: 'Conta de investimento', value: 92_105.32 }
];
