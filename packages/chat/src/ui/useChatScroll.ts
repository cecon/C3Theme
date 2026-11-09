import { useCallback, useLayoutEffect, useRef, useState, type RefObject } from 'react';

import type { Virtualizer } from '@tanstack/react-virtual';

import type { ChatRow } from './rows';

/** Distância do fim (px) que ainda conta como "no fim": mensagem nova rola junto. */
const BOTTOM_SLACK = 80;
/** Distância do topo (px) que pede o histórico anterior. */
const TOP_TRIGGER = 300;

interface Options {
  rows: ChatRow[];
  virtualizer: Virtualizer<HTMLDivElement, Element>;
  scrollRef: RefObject<HTMLDivElement | null>;
  hasMore: boolean;
  loadingOlder: boolean;
  onLoadOlder?: () => void;
  /** Quantos estão digitando: o indicador entra no pé e, se o usuário está no fim, a lista desce junto. */
  typingCount?: number;
}

/**
 * Rolagem de chat: abre no fim, segue o fim enquanto o usuário está lá (ou quando ele mesmo envia), segura a
 * posição quando o histórico entra em cima e conta as novas que chegaram enquanto ele lia mais acima.
 */
export default function useChatScroll({ rows, virtualizer, scrollRef, hasMore, loadingOlder, onLoadOlder, typingCount = 0 }: Options) {
  const atBottom = useRef(true);
  const anchor = useRef<{ key: string; offset: number } | null>(null);
  const lastKey = useRef<string | undefined>(undefined);
  const [unseen, setUnseen] = useState(0);

  const toEnd = useCallback(() => {
    if (rows.length) virtualizer.scrollToIndex(rows.length - 1, { align: 'end' });
    atBottom.current = true;
    setUnseen(0);
  }, [rows.length, virtualizer]);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < BOTTOM_SLACK;
    if (atBottom.current) setUnseen(0);
    // a primeira mensagem visível é a âncora para quando o histórico entrar em cima
    const first = virtualizer.getVirtualItems().find((v) => v.end > el.scrollTop && rows[v.index]?.type === 'message');
    anchor.current = first ? { key: rows[first.index].key, offset: first.start - el.scrollTop } : null;
    if (el.scrollTop < TOP_TRIGGER && hasMore && !loadingOlder) onLoadOlder?.();
  }, [scrollRef, virtualizer, rows, hasMore, loadingOlder, onLoadOlder]);

  useLayoutEffect(() => {
    const prevLast = lastKey.current;
    const last = rows.at(-1);
    lastKey.current = last?.key;
    if (!last) return;

    // abriu agora
    if (prevLast === undefined) return toEnd();

    // o fim mudou: chegou mensagem
    if (last.key !== prevLast) {
      const mine = last.type === 'message' && last.message.direction === 'out';
      if (atBottom.current || mine) return toEnd();
      const from = rows.findIndex((r) => r.key === prevLast);
      setUnseen((n) => n + rows.slice(from + 1).filter((r) => r.type === 'message').length);
      return;
    }

    // o fim não mudou: se a âncora andou, entrou histórico em cima; volta a mostrar o que estava na tela
    // quem está no fim (nem rolou ainda) continua no fim
    if (atBottom.current) return toEnd();
    const a = anchor.current;
    if (!a) return;
    const idx = rows.findIndex((r) => r.key === a.key);
    const item = idx >= 0 ? virtualizer.measurementsCache[idx] : undefined;
    const el = scrollRef.current;
    if (item && el && Math.abs(item.start - a.offset - el.scrollTop) > 1) virtualizer.scrollToOffset(item.start - a.offset);
  }, [rows, toEnd, virtualizer, scrollRef]);

  // página curta que não enche a tela não tem rolagem para pedir mais: pede sozinho
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && rows.length && el.scrollHeight <= el.clientHeight && hasMore && !loadingOlder) onLoadOlder?.();
  }, [rows.length, hasMore, loadingOlder, onLoadOlder, scrollRef]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && atBottom.current && typingCount > 0) el.scrollTop = el.scrollHeight;
  }, [typingCount, scrollRef]);

  return { onScroll, unseen, toEnd };
}
