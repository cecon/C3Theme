// Linhas da lista virtual: separador de dia e mensagem, cada uma com chave estável para medir e ancorar.

import { continuesGroup, localDay, startsDay } from '../core/grouping';
import type { Message } from '../core/types';

export type ChatRow = { type: 'day'; key: string; iso: string } | { type: 'message'; key: string; message: Message; grouped: boolean };

/**
 * Chave da mensagem: o `clientId` quando existe, para a otimista e a confirmada pelo servidor serem a mesma linha
 * (sem piscar nem perder a medida).
 */
export const messageKey = (m: Message) => m.clientId ?? m.id;

export function buildRows(messages: Message[]): ChatRow[] {
  const rows: ChatRow[] = [];
  messages.forEach((m, i) => {
    const prev = messages[i - 1];
    if (startsDay(prev, m)) rows.push({ type: 'day', key: `day:${localDay(m.createdAt)}`, iso: m.createdAt });
    rows.push({ type: 'message', key: messageKey(m), message: m, grouped: continuesGroup(prev, m) });
  });
  return rows;
}
