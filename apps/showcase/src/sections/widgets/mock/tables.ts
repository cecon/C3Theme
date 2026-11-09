// Linhas das tabelas dos widgets: produtos, chamados, projetos, vendas, pedidos e agenda.
import type { ByPeriod } from '../kit/period';
import { wave } from './kpis';
import type { StatusTone } from './feeds';

export const PRODUCTS: { name: string; sku: string; price: number; stock: number; sold: ByPeriod<number> }[] = [
  { name: 'Fone sem fio Pulse', sku: 'FN-2041', price: 349.9, stock: 128, sold: { dia: 14, semana: 92, mes: 386, ano: 4120 } },
  { name: 'Cafeteira Expresso 20 bar', sku: 'CF-1180', price: 899, stock: 12, sold: { dia: 5, semana: 31, mes: 140, ano: 1610 } },
  { name: 'Mochila Urbana 25 L', sku: 'MC-0932', price: 219.9, stock: 0, sold: { dia: 9, semana: 57, mes: 230, ano: 2804 } },
  { name: 'Relógio Fit Pro', sku: 'RL-3307', price: 1_199, stock: 46, sold: { dia: 3, semana: 24, mes: 118, ano: 1302 } },
  { name: 'Luminária de mesa LED', sku: 'LM-0415', price: 129.9, stock: 210, sold: { dia: 11, semana: 64, mes: 271, ano: 3015 } }
];

export const TICKETS: {
  id: string;
  subject: string;
  department: string;
  date: string;
  status: string;
  tone: StatusTone;
  person: number;
}[] = [
  {
    id: '#4821',
    subject: 'Erro ao emitir nota fiscal',
    department: 'Fiscal',
    date: '2026-10-18',
    status: 'Aberto',
    tone: 'danger',
    person: 5
  },
  {
    id: '#4818',
    subject: 'Alterar forma de pagamento',
    department: 'Financeiro',
    date: '2026-10-17',
    status: 'Em andamento',
    tone: 'warning',
    person: 6
  },
  {
    id: '#4815',
    subject: 'Integração com o ERP',
    department: 'Tecnologia',
    date: '2026-10-16',
    status: 'Em andamento',
    tone: 'warning',
    person: 1
  },
  {
    id: '#4809',
    subject: 'Dúvida sobre relatórios',
    department: 'Suporte',
    date: '2026-10-15',
    status: 'Resolvido',
    tone: 'success',
    person: 3
  },
  {
    id: '#4802',
    subject: 'Cadastro de nova filial',
    department: 'Comercial',
    date: '2026-10-14',
    status: 'Resolvido',
    tone: 'success',
    person: 7
  }
];

export const APP_SALES = [
  { name: 'App de pedidos', platform: 'Android e iOS', sales: 4_820, avg: 38.5, trend: wave(10, 30, 8, 51) },
  { name: 'Painel do lojista', platform: 'Web', sales: 2_160, avg: 129.9, trend: wave(10, 30, 8, 52) },
  { name: 'Ponto de venda', platform: 'Windows', sales: 1_340, avg: 249, trend: wave(10, 30, 8, 53) },
  { name: 'Catálogo digital', platform: 'Web', sales: 980, avg: 59.9, trend: wave(10, 30, 8, 54) }
];

export const PROJECTS: { name: string; client: string; team: number[]; due: string; progress: number; status: string; tone: StatusTone }[] =
  [
    {
      name: 'Portal do cliente',
      client: 'Seguradora Aurora',
      team: [0, 1, 2],
      due: '2026-11-15',
      progress: 72,
      status: 'No prazo',
      tone: 'success'
    },
    { name: 'App de entregas', client: 'Rede Sabor', team: [1, 3], due: '2026-10-30', progress: 88, status: 'Revisão', tone: 'info' },
    {
      name: 'Migração para nuvem',
      client: 'Grupo Itaipu',
      team: [3, 5, 7],
      due: '2026-10-22',
      progress: 54,
      status: 'Atrasado',
      tone: 'danger'
    },
    {
      name: 'E-commerce B2B',
      client: 'Metalúrgica Vale',
      team: [0, 2, 6, 7],
      due: '2026-12-10',
      progress: 31,
      status: 'No prazo',
      tone: 'success'
    }
  ];

export const LAST_SALES = [
  { product: 'Fone sem fio Pulse', customer: 'Padaria Pão Dourado', qty: 3, total: 1_049.7 },
  { product: 'Relógio Fit Pro', customer: 'Clínica Vida Plena', qty: 1, total: 1_199 },
  { product: 'Luminária de mesa LED', customer: 'Escola Saber Mais', qty: 12, total: 1_558.8 },
  { product: 'Cafeteira Expresso 20 bar', customer: 'Hotel Mar Azul', qty: 2, total: 1_798 },
  { product: 'Mochila Urbana 25 L', customer: 'Auto Peças Paraná', qty: 5, total: 1_099.5 }
];

export const CUSTOMERS_BY_STATE = [
  { uf: 'SP', state: 'São Paulo', customers: 4_812, revenue: 982_400 },
  { uf: 'RJ', state: 'Rio de Janeiro', customers: 2_105, revenue: 431_900 },
  { uf: 'MG', state: 'Minas Gerais', customers: 1_884, revenue: 362_150 },
  { uf: 'PR', state: 'Paraná', customers: 1_230, revenue: 251_300 },
  { uf: 'RS', state: 'Rio Grande do Sul', customers: 1_102, revenue: 224_780 },
  { uf: 'BA', state: 'Bahia', customers: 874, revenue: 160_420 }
];

export const ORDERS: {
  id: string;
  customer: string;
  document: string;
  product: string;
  total: number;
  date: string;
  status: string;
  tone: StatusTone;
}[] = [
  {
    id: '10482',
    customer: 'Padaria Pão Dourado',
    document: '12.345.678/0001-90',
    product: 'Fone sem fio Pulse',
    total: 1_240,
    date: '2026-10-18',
    status: 'Pago',
    tone: 'success'
  },
  {
    id: '10481',
    customer: 'Mariana Costa',
    document: '123.456.789-09',
    product: 'Relógio Fit Pro',
    total: 1_199,
    date: '2026-10-18',
    status: 'Aguardando',
    tone: 'warning'
  },
  {
    id: '10479',
    customer: 'Escola Saber Mais',
    document: '23.456.789/0001-01',
    product: 'Luminária de mesa LED',
    total: 389.9,
    date: '2026-10-17',
    status: 'Enviado',
    tone: 'info'
  },
  {
    id: '10475',
    customer: 'João Pereira',
    document: '987.654.321-00',
    product: 'Mochila Urbana 25 L',
    total: 219.9,
    date: '2026-10-17',
    status: 'Pago',
    tone: 'success'
  },
  {
    id: '10461',
    customer: 'Hotel Mar Azul',
    document: '34.567.890/0001-12',
    product: 'Cafeteira Expresso 20 bar',
    total: 1_798,
    date: '2026-10-16',
    status: 'Cancelado',
    tone: 'danger'
  },
  {
    id: '10458',
    customer: 'Luciana Martins',
    document: '456.789.123-45',
    product: 'Fone sem fio Pulse',
    total: 349.9,
    date: '2026-10-15',
    status: 'Entregue',
    tone: 'primary'
  }
];

export const AGENDA: { date: string; time: string; title: string; tone: StatusTone }[] = [
  { date: '2026-10-18', time: '09:00', title: 'Café com a diretoria', tone: 'primary' },
  { date: '2026-10-18', time: '15:30', title: 'Demonstração para a Rede Sabor', tone: 'success' },
  { date: '2026-10-20', time: '10:00', title: 'Entrega do módulo de estoque', tone: 'warning' },
  { date: '2026-10-22', time: '14:00', title: 'Revisão de orçamento 2027', tone: 'info' },
  { date: '2026-10-23', time: '08:30', title: 'Treinamento em Recife', tone: 'success' },
  { date: '2026-10-27', time: '22:00', title: 'Migração do banco de dados', tone: 'danger' },
  { date: '2026-10-29', time: '11:00', title: 'Reunião de resultados', tone: 'primary' }
];
