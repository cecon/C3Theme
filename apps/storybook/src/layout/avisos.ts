import type { NotificationItem } from '@c3theme/ui';

export const AVISOS: NotificationItem[] = [
  { id: '1', title: 'Fatura FT-0042 paga', description: 'Ana Souza · R$ 1.234,50', time: 'há 5 min', tone: 'success' },
  { id: '2', title: 'Pedido aguardando aprovação', description: 'Pedido 318 passou do limite de crédito', time: 'há 1 h', tone: 'warning' },
  { id: '3', title: 'Exportação pronta', description: 'clientes-novembro.csv', time: 'ontem', read: true, tone: 'info' }
];
