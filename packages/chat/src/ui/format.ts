import { useIntl } from 'react-intl';

import { localDay } from '../core/grouping';
import { useChatText } from './text';

/** Hora curta da mensagem, ex.: "14:05". */
export function useTimeFormat() {
  const intl = useIntl();
  return (iso: string) => intl.formatTime(iso, { hour: '2-digit', minute: '2-digit' });
}

/** Rótulos relativos a hoje: "Hoje", "Ontem", ou a data. */
export function useDayFormat() {
  const intl = useIntl();
  const t = useChatText();
  const today = localDay(new Date().toISOString());
  const yesterday = localDay(new Date(Date.now() - 864e5).toISOString());
  return {
    /** Separador do histórico: "Hoje", "Ontem", "sexta-feira, 24 de outubro". */
    separator(iso: string) {
      const day = localDay(iso);
      if (day === today) return t('c3.chat.today');
      if (day === yesterday) return t('c3.chat.yesterday');
      return intl.formatDate(iso, { weekday: 'long', day: 'numeric', month: 'long' });
    },
    /** Lista de conversas: hora se hoje, "Ontem", ou dia/mês. */
    short(iso: string) {
      const day = localDay(iso);
      if (day === today) return intl.formatTime(iso, { hour: '2-digit', minute: '2-digit' });
      if (day === yesterday) return t('c3.chat.yesterday');
      return intl.formatDate(iso, { day: '2-digit', month: '2-digit' });
    }
  };
}

/** Tamanho legível: "820 KB", "1,4 MB". */
export function useBytesFormat() {
  const intl = useIntl();
  return (bytes: number) =>
    bytes < 1024 * 1024
      ? `${intl.formatNumber(Math.max(1, Math.round(bytes / 1024)))} KB`
      : `${intl.formatNumber(bytes / (1024 * 1024), { maximumFractionDigits: 1 })} MB`;
}

/** Duração "m:ss" (áudio, gravação). */
export const clock = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** Duração curta: "0,8 s", "4 s", "1 min 5 s". */
export function useDurationFormat() {
  const intl = useIntl();
  return (ms: number) => {
    if (ms < 1000) return `${intl.formatNumber(Math.max(ms, 100) / 1000, { maximumFractionDigits: 1 })} s`;
    const s = Math.round(ms / 1000);
    return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min${s % 60 ? ` ${s % 60} s` : ''}`;
  };
}
