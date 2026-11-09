// Sino em memória (GET /_notifications, POST /_notifications/_read): os avisos do seed, do mais novo ao mais velho.

import type { C3Notification, NotificationList } from '../api';

export function memoryNotifications(seed: C3Notification[], now: () => Date) {
  const items = seed.map((n) => ({ ...n }));
  const unread = () => items.filter((n) => n.readAt === null).length;
  return {
    list(limit = 20): NotificationList {
      const sorted = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return { items: sorted.slice(0, Math.max(1, Math.min(limit, 100))).map((n) => ({ ...n })), unread: unread() };
    },
    read(ids?: string[]): { unread: number } {
      const at = now().toISOString();
      for (const n of items) if (n.readAt === null && (!ids || ids.includes(n.id))) n.readAt = at;
      return { unread: unread() };
    }
  };
}
