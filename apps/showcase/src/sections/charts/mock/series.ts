// Séries dos gráficos: receita, vendas, visitas, pedidos, canais e metas.

export const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

/** Receita e despesa mensais, em reais. */
export const RECEITA = [182000, 176500, 198300, 205400, 221900, 214700, 236100, 248800, 239500, 262300, 284900, 318600];
export const DESPESA = [141200, 138900, 150400, 149800, 162300, 158100, 171500, 176900, 169400, 181200, 195700, 214300];

/** Vendas por região, por canal (em milhares de reais). */
export const REGIOES = ['Sudeste', 'Sul', 'Nordeste', 'Centro-Oeste', 'Norte'];
export const VENDAS_LOJA = [1240, 610, 540, 320, 180];
export const VENDAS_ONLINE = [980, 420, 470, 260, 150];

/** Faturamento trimestral comparado (em milhares de reais). */
export const TRIMESTRES = ['1º tri', '2º tri', '3º tri', '4º tri'];
export const FAT_2025 = [512, 548, 589, 702];
export const FAT_2026 = [557, 642, 724, 866];

/** Visitas diárias no site e no aplicativo na última quinzena. */
export const DIAS = Array.from({ length: 14 }, (_, i) => `${i + 1}/10`);
export const VISITAS_SITE = [4200, 4380, 4100, 4650, 5120, 3900, 3700, 4480, 4720, 4910, 5230, 5480, 4100, 3950];
export const VISITAS_APP = [2900, 3050, 3180, 3240, 3500, 3920, 4010, 3360, 3480, 3610, 3790, 3880, 4320, 4450];

/** Pedidos por semana e a meta semanal (mesma unidade: pedidos). */
export const SEMANAS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'];
export const PEDIDOS = [312, 345, 298, 401, 388, 426, 452, 470];
export const META_PEDIDOS = [320, 330, 340, 350, 370, 390, 410, 430];

/** Participação de cada canal nas vendas. */
export const CANAIS = [
  { id: 'loja', label: 'Lojas físicas', value: 46 },
  { id: 'site', label: 'Site', value: 27 },
  { id: 'app', label: 'Aplicativo', value: 18 },
  { id: 'marketplace', label: 'Marketplaces', value: 9 }
];

/** Formas de pagamento (quantidade de pedidos no mês). */
export const PAGAMENTOS = [
  { id: 'pix', label: 'Pix', value: 1840 },
  { id: 'credito', label: 'Cartão de crédito', value: 1520 },
  { id: 'debito', label: 'Cartão de débito', value: 610 },
  { id: 'boleto', label: 'Boleto', value: 230 }
];

/** Avaliação média (0 a 10) de duas lojas em cada critério. */
export const CRITERIOS = ['Atendimento', 'Preço', 'Entrega', 'Variedade', 'Limpeza', 'Pós-venda'];
export const LOJA_PAULISTA = [9.1, 7.2, 8.4, 8.8, 9.3, 7.6];
export const LOJA_SAVASSI = [8.2, 8.5, 7.1, 7.9, 8.6, 8.8];

/** Metas do mês: realizado em % da meta. */
export const METAS = [
  { label: 'Vendas', valor: 82 },
  { label: 'Novos clientes', valor: 64 },
  { label: 'Satisfação', valor: 93 }
];
