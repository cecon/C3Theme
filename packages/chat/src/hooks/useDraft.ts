import { useCallback, useEffect, useRef, useState } from 'react';

import type { DraftStorage } from '../core/transport';
import { localStorageDrafts } from '../adapters/localStorageDrafts';

const fallback = localStorageDrafts();

/**
 * Rascunho por conversa: trocar de conversa e voltar devolve o que estava escrito. Grava com atraso curto
 * (`delayMs`) para não escrever a cada tecla, e grava na hora ao trocar de conversa ou desmontar.
 */
export default function useDraft(conversationId: string, storage: DraftStorage = fallback, delayMs = 400) {
  const [text, setText] = useState(() => storage.get(conversationId));
  const pending = useRef<{ id: string; text: string } | null>(null);

  const flush = useCallback(() => {
    if (pending.current) storage.set(pending.current.id, pending.current.text);
    pending.current = null;
  }, [storage]);

  // troca de conversa: grava a anterior e carrega a nova
  useEffect(() => {
    setText(storage.get(conversationId));
    return flush;
  }, [conversationId, storage, flush]);

  useEffect(() => {
    if (!pending.current) return;
    const timer = setTimeout(flush, delayMs);
    return () => clearTimeout(timer);
  }, [text, delayMs, flush]);

  const change = useCallback(
    (next: string) => {
      pending.current = { id: conversationId, text: next };
      setText(next);
    },
    [conversationId]
  );

  /** Depois de enviar: limpa o campo e o guardado. */
  const clear = useCallback(() => {
    pending.current = null;
    storage.set(conversationId, '');
    setText('');
  }, [conversationId, storage]);

  return { text, setText: change, clear };
}
