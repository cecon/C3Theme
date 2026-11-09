// Eixos e séries dos gráficos dos widgets.
import type { ByPeriod } from '../kit/period';
import type { ChartTone } from '../kit/useChartColors';
import { noise, wave } from './kpis';

// ---------------------------------------------------------------- eixos e séries dos gráficos

export const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** Rótulos do eixo X para cada período. */
export const PERIOD_AXIS: ByPeriod<string[]> = {
  dia: ['00h', '03h', '06h', '09h', '12h', '15h', '18h', '21h'],
  semana: ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'],
  mes: ['01', '04', '07', '10', '13', '16', '19', '22', '25', '28'],
  ano: MONTHS
};

/** Uma série com o tamanho do eixo do período. */
export const periodSeries = (base: number, amplitude: number, seed: number): ByPeriod<number[]> => ({
  dia: wave(PERIOD_AXIS.dia.length, base * 0.2, amplitude * 0.2, seed),
  semana: wave(PERIOD_AXIS.semana.length, base * 0.6, amplitude * 0.6, seed + 1),
  mes: wave(PERIOD_AXIS.mes.length, base, amplitude, seed + 2),
  ano: wave(PERIOD_AXIS.ano.length, base * 3, amplitude * 3, seed + 3)
});

export const REPEAT_RATE: ByPeriod<{ rate: number; change: number; series: number[] }> = {
  dia: { rate: 4.8, change: 0.6, series: wave(8, 4.5, 0.8, 2) },
  semana: { rate: 5.1, change: 1.4, series: wave(7, 5, 1, 3) },
  mes: { rate: 5.44, change: 2.7, series: wave(10, 5.2, 1.2, 4) },
  ano: { rate: 6.02, change: -0.8, series: wave(12, 5.8, 1.4, 5) }
};

export const PROJECT_OVERVIEW: ByPeriod<{ label: string; value: string; change: number; points: number[] }[]> = {
  dia: [
    { label: 'Projetos ativos', value: '34', change: 0, points: wave(8, 30, 3, 1) },
    { label: 'Tarefas concluídas', value: '58', change: 6.2, points: wave(8, 40, 10, 2) },
    { label: 'Horas registradas', value: '212', change: -2.4, points: wave(8, 60, 12, 3) }
  ],
  semana: [
    { label: 'Projetos ativos', value: '34', change: 3.0, points: wave(7, 30, 4, 4) },
    { label: 'Tarefas concluídas', value: '326', change: 9.1, points: wave(7, 45, 12, 5) },
    { label: 'Horas registradas', value: '1.108', change: 4.3, points: wave(7, 70, 15, 6) }
  ],
  mes: [
    { label: 'Projetos ativos', value: '37', change: 8.8, points: wave(10, 32, 5, 7) },
    { label: 'Tarefas concluídas', value: '1.248', change: 14.6, points: wave(10, 50, 14, 8) },
    { label: 'Horas registradas', value: '3.460', change: -1.2, points: wave(10, 80, 18, 9) }
  ],
  ano: [
    { label: 'Projetos ativos', value: '52', change: 21.4, points: wave(12, 40, 8, 10) },
    { label: 'Tarefas concluídas', value: '14.902', change: 18.3, points: wave(12, 60, 18, 11) },
    { label: 'Horas registradas', value: '41.230', change: 7.7, points: wave(12, 90, 20, 12) }
  ]
};

export interface Slice {
  label: string;
  value: number;
  tone: ChartTone;
}

export const INCOME_BY_CHANNEL: ByPeriod<Slice[]> = {
  dia: [
    { label: 'Loja on-line', value: 4_820, tone: 'primary' },
    { label: 'Marketplace', value: 2_310, tone: 'info' },
    { label: 'Loja física', value: 1_290, tone: 'success' }
  ],
  semana: [
    { label: 'Loja on-line', value: 28_400, tone: 'primary' },
    { label: 'Marketplace', value: 14_950, tone: 'info' },
    { label: 'Loja física', value: 8_030, tone: 'success' }
  ],
  mes: [
    { label: 'Loja on-line', value: 118_200, tone: 'primary' },
    { label: 'Marketplace', value: 61_400, tone: 'info' },
    { label: 'Loja física', value: 35_300, tone: 'success' }
  ],
  ano: [
    { label: 'Loja on-line', value: 1_320_000, tone: 'primary' },
    { label: 'Marketplace', value: 704_000, tone: 'info' },
    { label: 'Loja física', value: 412_000, tone: 'success' }
  ]
};

export const TOTAL_INCOME: Slice[] = [
  { label: 'Assinaturas', value: 184_300, tone: 'primary' },
  { label: 'Serviços', value: 96_750, tone: 'warning' },
  { label: 'Licenças', value: 61_200, tone: 'success' },
  { label: 'Treinamentos', value: 23_480, tone: 'info' }
];

export const METRIC_CARDS = {
  orders: { dia: 64, semana: 72, mes: 81, ano: 77 } as ByPeriod<number>,
  users: periodSeries(40, 14, 21),
  visitors: periodSeries(55, 20, 31)
};

export const PROJECT_ANALYTICS: Record<
  string,
  { label: string; current: number[]; previous: number[]; stats: { label: string; value: string; change: number; invert?: boolean }[] }
> = {
  geral: {
    label: 'Visão geral',
    current: [44, 55, 57, 56, 61, 58, 63, 60, 66, 70, 72, 78],
    previous: [36, 42, 45, 48, 50, 47, 52, 55, 57, 59, 60, 64],
    stats: [
      { label: 'Receita', value: 'R$ 742 mil', change: 12.4 },
      { label: 'Custos', value: 'R$ 318 mil', change: -3.2, invert: true },
      { label: 'Margem', value: '57,1%', change: 4.8 }
    ]
  },
  marketing: {
    label: 'Marketing',
    current: [22, 28, 30, 26, 34, 40, 38, 42, 45, 41, 48, 52],
    previous: [20, 24, 26, 25, 28, 30, 31, 33, 35, 36, 38, 40],
    stats: [
      { label: 'Leads', value: '9.420', change: 18.2 },
      { label: 'Custo por lead', value: 'R$ 7,80', change: -6.1, invert: true },
      { label: 'Conversão', value: '3,9%', change: 0.7 }
    ]
  },
  projetos: {
    label: 'Projetos',
    current: [8, 10, 9, 12, 14, 13, 15, 16, 18, 17, 19, 21],
    previous: [6, 8, 8, 9, 10, 11, 12, 12, 13, 14, 15, 15],
    stats: [
      { label: 'Entregues', value: '172', change: 9.6 },
      { label: 'No prazo', value: '91%', change: 2.1 },
      { label: 'Atrasados', value: '6', change: -25, invert: true }
    ]
  },
  pedidos: {
    label: 'Pedidos',
    current: [310, 280, 340, 360, 390, 420, 400, 450, 470, 500, 540, 610],
    previous: [260, 250, 290, 300, 330, 350, 360, 380, 400, 410, 430, 480],
    stats: [
      { label: 'Pedidos', value: '5.070', change: 15.3 },
      { label: 'Devoluções', value: '1,4%', change: -0.3, invert: true },
      { label: 'Prazo médio', value: '2,6 dias', change: -8.0, invert: true }
    ]
  }
};

export const CATEGORY_SALES: ByPeriod<{ label: string; value: number }[]> = {
  dia: [
    { label: 'Eletrônicos', value: 42 },
    { label: 'Casa', value: 31 },
    { label: 'Moda', value: 27 },
    { label: 'Esporte', value: 18 },
    { label: 'Livros', value: 11 }
  ],
  semana: [
    { label: 'Eletrônicos', value: 260 },
    { label: 'Casa', value: 214 },
    { label: 'Moda', value: 198 },
    { label: 'Esporte', value: 121 },
    { label: 'Livros', value: 84 }
  ],
  mes: [
    { label: 'Eletrônicos', value: 1_120 },
    { label: 'Moda', value: 942 },
    { label: 'Casa', value: 905 },
    { label: 'Esporte', value: 530 },
    { label: 'Livros', value: 377 }
  ],
  ano: [
    { label: 'Eletrônicos', value: 13_400 },
    { label: 'Moda', value: 11_820 },
    { label: 'Casa', value: 10_950 },
    { label: 'Esporte', value: 6_210 },
    { label: 'Livros', value: 4_380 }
  ]
};

export const LANGUAGES = [
  { code: 'pt-BR', label: 'Português', users: 18_420 },
  { code: 'en', label: 'Inglês', users: 6_310 },
  { code: 'es', label: 'Espanhol', users: 3_980 }
];
export const MORE_LANGUAGES = [
  { code: 'fr', label: 'Francês', users: 0 },
  { code: 'it', label: 'Italiano', users: 0 },
  { code: 'de', label: 'Alemão', users: 0 }
];
export const LANGUAGE_DOWNLOADS = wave(18, 120, 50, 7);

export const MONTHLY_REPORT: Record<string, { revenue: number[]; expenses: number[]; profit: number[] }> = {
  '2026': {
    revenue: [82, 90, 96, 88, 104, 112, 118, 121, 115, 128],
    expenses: [61, 64, 70, 66, 72, 75, 79, 80, 78, 83],
    profit: [21, 26, 26, 22, 32, 37, 39, 41, 37, 45]
  },
  '2025': {
    revenue: [70, 74, 79, 76, 85, 92, 95, 99, 97, 104, 110, 126],
    expenses: [55, 58, 60, 59, 63, 67, 70, 71, 72, 75, 79, 88],
    profit: [15, 16, 19, 17, 22, 25, 25, 28, 25, 29, 31, 38]
  },
  '2024': {
    revenue: [58, 61, 66, 63, 70, 74, 78, 80, 79, 84, 90, 101],
    expenses: [47, 49, 52, 51, 55, 58, 60, 61, 62, 64, 68, 75],
    profit: [11, 12, 14, 12, 15, 16, 18, 19, 17, 20, 22, 26]
  }
};

export const SALES_REPORT: ByPeriod<{ labels: string[]; revenue: number[]; profit: number[] }> = {
  dia: { labels: PERIOD_AXIS.dia, revenue: wave(8, 9, 4, 41), profit: wave(8, 3, 1.5, 42) },
  semana: { labels: PERIOD_AXIS.semana, revenue: wave(7, 52, 14, 43), profit: wave(7, 18, 6, 44) },
  mes: { labels: ['S1', 'S2', 'S3', 'S4', 'S5'], revenue: [48, 56, 61, 53, 39], profit: [15, 19, 22, 17, 12] },
  ano: { labels: MONTHS, revenue: wave(12, 210, 40, 45), profit: wave(12, 70, 15, 46) }
};

export const ACQUISITION = {
  months: MONTHS.slice(4, 11),
  organic: [32, 28, 35, 40, 38, 44, 47],
  paid: [18, 22, 20, 24, 30, 27, 31],
  social: [12, 14, 16, 13, 17, 20, 22],
  channels: [
    { label: 'Busca orgânica', detail: 'Hoje, 09:40', value: 1_430, change: 8.4 },
    { label: 'Anúncios pagos', detail: 'Hoje, 08:15', value: 980, change: -3.6 },
    { label: 'Redes sociais', detail: 'Ontem, 18:02', value: 612, change: 12.9 }
  ]
};

export const INCOME_OVERVIEW: Record<'semana' | 'mes', Record<'volume' | 'margem' | 'vendas', { labels: string[]; values: number[] }>> = {
  semana: {
    volume: { labels: PERIOD_AXIS.semana, values: [120, 132, 101, 134, 190, 230, 210] },
    margem: { labels: PERIOD_AXIS.semana, values: [32, 35, 28, 37, 41, 46, 44] },
    vendas: { labels: PERIOD_AXIS.semana, values: [8.2, 9.1, 7.4, 9.6, 12.8, 15.2, 13.9] }
  },
  mes: {
    volume: { labels: MONTHS, values: [820, 932, 901, 934, 1290, 1330, 1320, 1410, 1380, 1520, 1610, 1790] },
    margem: { labels: MONTHS, values: [31, 33, 32, 34, 38, 39, 40, 41, 40, 43, 44, 46] },
    vendas: { labels: MONTHS, values: [61, 68, 66, 70, 92, 95, 94, 101, 99, 108, 114, 127] }
  }
};

export const TEAM_RADAR = {
  metrics: ['Prazo', 'Qualidade', 'Comunicação', 'Inovação', 'Custo', 'Satisfação'],
  current: [86, 92, 74, 68, 80, 90],
  goal: [80, 85, 80, 75, 75, 85]
};

/** Clientes: ticket médio (R$) x pedidos por mês, por segmento. */
export const CUSTOMER_SCATTER = {
  varejo: Array.from({ length: 22 }, (_, i) => ({ id: `v${i}`, x: 40 + noise(i, 1) * 180, y: Math.round(2 + noise(i, 2) * 8) })),
  atacado: Array.from({ length: 14 }, (_, i) => ({ id: `a${i}`, x: 240 + noise(i, 3) * 360, y: Math.round(1 + noise(i, 4) * 4) }))
};
