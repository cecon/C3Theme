// Registros das telas de operação (quadro, agenda e planta): o "backend" das histórias de Telas.

import type { C3Notification, WireRecord } from '@c3theme/engine';

const ETAPAS = ['a_fazer', 'a_fazer', 'fazendo', 'fazendo', 'revisao', 'feito', 'feito'];
const TITULOS = [
  'Conferir notas de entrada',
  'Ajustar preço da tabela de atacado',
  'Cadastrar fornecedor novo',
  'Revisar comissão de outubro',
  'Fechar caixa da loja Centro',
  'Treinar equipe no PDV novo',
  'Enviar boletos atrasados',
  'Atualizar certificado digital',
  'Inventário do depósito',
  'Renegociar frete com a transportadora'
];

/** Data ISO a `days` dias de hoje: o quadro e a agenda abrem no mês corrente, então os dados acompanham. */
const fromToday = (days: number, hour?: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  if (hour === undefined) return d.toISOString().slice(0, 10);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

export const tarefas: WireRecord[] = TITULOS.map((titulo, i) => ({
  id: String(i + 1),
  titulo,
  codigo: `OP-${String(i + 101)}`,
  etapa: ETAPAS[i % ETAPAS.length],
  prioridade: ['media', 'alta', 'baixa'][i % 3],
  responsavel: String((i % 3) + 1),
  prazo: fromToday((i % 5) * 2 - 3),
  comentarios: i % 4
}));

export const eventos: WireRecord[] = [
  { id: '1', titulo: 'Reunião de vendas', inicio: fromToday(0, 9), fim: fromToday(0, 10), tipo: 'reuniao' },
  { id: '2', titulo: 'Visita à Carla Mendes', inicio: fromToday(2, 14), fim: fromToday(2, 16), tipo: 'visita' },
  { id: '3', titulo: 'Entrega do pedido 318', inicio: fromToday(4, 8), tipo: 'entrega' },
  { id: '4', titulo: 'Feriado municipal', inicio: fromToday(-5, 0), dia_inteiro: true, tipo: 'feriado' },
  { id: '5', titulo: 'Fechamento do mês', inicio: fromToday(7, 10), fim: fromToday(7, 12), tipo: 'reuniao' }
];

const SITUACAO = ['livre', 'ocupada', 'livre', 'conta', 'ocupada', 'livre', 'bloqueada', 'livre'];

export const mesas: WireRecord[] = Array.from({ length: 12 }, (_, i) => ({
  id: String(i + 1),
  nome: `Mesa ${i + 1}`,
  area: i < 8 ? 'salao' : 'varanda',
  lugares: [2, 4, 4, 6][i % 4],
  situacao: SITUACAO[i % SITUACAO.length]
}));

/** Avisos do sino (`layout.header.notifications`): dois não lidos, um já lido. */
const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString();
export const avisos: C3Notification[] = [
  {
    id: '1',
    title: 'Fatura FT-0007 venceu',
    description: 'Cliente Gisele Rocha',
    tone: 'danger',
    createdAt: ago(12),
    readAt: null,
    to: '/fatura/7'
  },
  { id: '2', title: 'Pedido de compra aprovado', tone: 'success', createdAt: ago(95), readAt: null },
  { id: '3', title: 'Backup da noite concluído', tone: 'info', createdAt: ago(60 * 20), readAt: ago(60 * 19) }
];
