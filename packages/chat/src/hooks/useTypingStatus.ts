import { useCallback, useEffect, useRef, useState } from 'react';

import type { ChatTransport } from '../core/transport';
import { activeTypists, TYPING_TTL_MS, type Typist, updateTypists } from '../core/typing';
import type { Author } from '../core/types';

/** Intervalo mínimo entre dois avisos "estou digitando" enviados. */
export const TYPING_THROTTLE_MS = 3000;
/** Sem tecla por este tempo, envio "parei". */
export const TYPING_IDLE_MS = 5000;

/**
 * "Digitando…" nos dois sentidos. Entrada: quem está digitando agora na conversa (some sozinho após 6 s sem
 * renovar). Saída: chame `typed()` a cada tecla; o hook manda no máximo um aviso a cada 3 s e o "parei" depois de
 * 5 s parado, ou na hora com `stopped()` (ex.: ao enviar).
 */
export default function useTypingStatus(transport: ChatTransport, conversationId: string, me?: Pick<Author, 'id'>) {
  const [typists, setTypists] = useState<Typist[]>([]);

  useEffect(() => {
    setTypists([]);
    return transport.subscribe(conversationId, (e) => {
      if (e.type !== 'typing' || e.conversationId !== conversationId || e.author.id === me?.id) return;
      setTypists((list) => updateTypists(list, e.author, e.typing, Date.now()));
    });
  }, [transport, conversationId, me?.id]);

  // tira quem venceu sem mandar "parei"
  useEffect(() => {
    if (typists.length === 0) return;
    const next = Math.min(...typists.map((t) => t.until)) - Date.now();
    const timer = setTimeout(() => setTypists((list) => activeTypists(list, Date.now())), Math.max(0, next) + 50);
    return () => clearTimeout(timer);
  }, [typists]);

  const lastSent = useRef(0);
  const idle = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const stopped = useCallback(() => {
    clearTimeout(idle.current);
    idle.current = undefined;
    if (lastSent.current) transport.sendTyping?.(conversationId, false);
    lastSent.current = 0;
  }, [transport, conversationId]);

  const typed = useCallback(() => {
    const now = Date.now();
    if (now - lastSent.current >= TYPING_THROTTLE_MS) {
      transport.sendTyping?.(conversationId, true);
      lastSent.current = now;
    }
    clearTimeout(idle.current);
    idle.current = setTimeout(stopped, TYPING_IDLE_MS);
  }, [transport, conversationId, stopped]);

  // trocar de conversa ou sair encerra o "digitando" da anterior
  useEffect(() => stopped, [stopped]);

  return { typing: typists.map((t) => t.author), typed, stopped, ttlMs: TYPING_TTL_MS };
}
