// Sino do exemplo (spec/v0/notifications.yaml), o mesmo do crates/c3-example: avisos em memória, por usuário, com
// três de exemplo na primeira leitura. Sistema de verdade guarda numa tabela própria e cria o aviso quando o fato
// acontece (e chama `bell.notify(usuário)`).

import type { Notification, Notifications } from '@c3theme/engine-node';

import { user } from './users';

const sample = (): Notification[] => [
  { id: '3', title: 'Pedido aguardando aprovação', tone: 'warning', createdAt: '2026-11-09T12:00:00Z', readAt: null, to: '/sales_order' },
  { id: '2', title: 'Cliente novo cadastrado', tone: 'success', createdAt: '2026-11-09T11:00:00Z', readAt: null, to: '/customer' },
  { id: '1', title: 'Versão nova do sistema', tone: 'info', createdAt: '2026-11-09T10:00:00Z', readAt: null }
];

export function exampleNotifications(): Notifications {
  const byUser = new Map<string, Notification[]>();
  const mine = (a: string) => {
    if (!byUser.has(a)) byUser.set(a, sample());
    return byUser.get(a)!;
  };
  const unread = (a: string) => mine(a).filter((n) => n.readAt === null).length;
  return {
    audience: (req) => user(req) ?? 'anon',
    list: (a, limit) => ({ items: mine(a).slice(0, limit), unread: unread(a) }),
    markRead: (a, ids) => {
      const at = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
      for (const n of mine(a)) if (n.readAt === null && (!ids || ids.includes(n.id))) n.readAt = at;
      return unread(a);
    }
  };
}
