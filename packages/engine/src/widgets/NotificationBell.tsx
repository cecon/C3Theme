import { useEffect } from 'react';
import { useIntl } from 'react-intl';
import useSWR from 'swr';

import { NotificationsButton } from '@c3theme/ui';

import { ApiError, type C3Notification } from '../api';
import { useEngine } from '../context';
import { nextWait } from '../live/liveKeys';

/** Quantos avisos o sino mostra. */
const LIMIT = 20;
const KEY = ['c3-notifications'];

/** "há 5 min", "ontem": quando o aviso chegou, no idioma da tela. */
export function timeAgo(iso: string, locale: string, now = Date.now()): string {
  const s = Math.round((new Date(iso).getTime() - now) / 1000);
  if (Number.isNaN(s)) return '';
  const fmt = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'short' });
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ['second', 60],
    ['minute', 60],
    ['hour', 24],
    ['day', 7],
    ['week', 4.35],
    ['month', 12],
    ['year', Infinity]
  ];
  let v = s;
  for (const [unit, size] of steps) {
    if (Math.abs(v) < size) return fmt.format(Math.round(v), unit);
    v /= size;
  }
  return '';
}

/**
 * Sino do header (`layout.header.notifications`, #155): lê GET /_notifications, assina /_notifications/_events
 * para o contador subir na hora (reconecta como o `live`) e marca como lido ao clicar. A navegação para `to` é do
 * NotificationsButton.
 */
export default function NotificationBell() {
  const { client } = useEngine();
  const intl = useIntl();
  const { data, mutate } = useSWR(client.notifications ? KEY : null, () => client.notifications!(LIMIT));

  useEffect(() => {
    if (!client.notificationEvents) return;
    const ctrl = new AbortController();
    (async () => {
      let wait = 1000;
      while (!ctrl.signal.aborted) {
        try {
          await client.notificationEvents!((m) => {
            // ready também relê: quem reconecta pode ter perdido avisos
            if (m.type === 'ready') wait = 1000;
            if (m.type === 'ready' || m.type === 'notification') void mutate();
          }, ctrl.signal);
        } catch (e) {
          if (e instanceof ApiError && [401, 403, 404].includes(e.status)) return;
        }
        await new Promise((r) => setTimeout(r, wait));
        wait = nextWait(wait);
      }
    })();
    return () => ctrl.abort();
  }, [client, mutate]);

  const read = async (ids?: string[]) => {
    if (!client.readNotifications) return;
    await client.readNotifications(ids).catch(() => undefined);
    void mutate();
  };

  const items = (data?.items ?? []).map((n: C3Notification) => ({
    id: n.id,
    title: n.title,
    description: n.description,
    tone: n.tone,
    to: n.to,
    read: n.readAt !== null,
    time: timeAgo(n.createdAt, intl.locale)
  }));

  return (
    <NotificationsButton
      items={items}
      unread={data?.unread}
      onItemClick={(n) => {
        if (!n.read) void read([n.id]);
      }}
      onMarkAllRead={() => void read()}
    />
  );
}
