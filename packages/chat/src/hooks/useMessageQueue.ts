import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/** Mensagem escrita enquanto o assistente respondia: espera a vez acima da caixa. */
export interface QueuedMessage {
  id: string;
  text: string;
  files: File[];
}

export interface UseMessageQueueOptions {
  /** O assistente está respondendo (`generating` do `useMessageWindow`). */
  generating: boolean;
  /** Envia de fato (o `send` do app). */
  send: (text: string, files: File[]) => void;
  /** Trocar de conversa esvazia a fila. */
  conversationId?: string;
}

let seq = 0;

/**
 * Fila da próxima mensagem, como nos assistentes de IA: o que se escreve enquanto o assistente responde entra na
 * fila e sai sozinho quando a resposta termina, uma por vez. Dá para editar, tirar ou mandar na hora. Depois de
 * `pause` (o usuário apertou Parar), a fila não sai sozinha na próxima parada: quem parou quer decidir.
 */
export default function useMessageQueue({ generating, send, conversationId }: UseMessageQueueOptions) {
  const [items, setItems] = useState<QueuedMessage[]>([]);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const paused = useRef(false);
  const was = useRef(generating);
  const sendRef = useRef(send);
  sendRef.current = send;

  useEffect(() => setItems([]), [conversationId]);

  useEffect(() => {
    const ended = was.current && !generating;
    was.current = generating;
    if (!ended) return;
    if (paused.current) {
      paused.current = false;
      return;
    }
    const [next] = itemsRef.current;
    if (!next) return;
    setItems((list) => list.filter((q) => q.id !== next.id));
    sendRef.current(next.text, next.files);
  }, [generating]);

  const enqueue = useCallback((text: string, files: File[] = []) => {
    if (!text.trim() && !files.length) return;
    setItems((list) => [...list, { id: `q${++seq}`, text: text.trim(), files }]);
  }, []);

  const actions = useMemo(
    () => ({
      enqueue,
      update: (id: string, text: string) => setItems((list) => list.map((q) => (q.id === id ? { ...q, text } : q))),
      remove: (id: string) => setItems((list) => list.filter((q) => q.id !== id)),
      /** Manda já (só faz sentido com o assistente parado). */
      sendNow: (id: string) => {
        const item = itemsRef.current.find((q) => q.id === id);
        if (!item) return;
        setItems((list) => list.filter((q) => q.id !== id));
        sendRef.current(item.text, item.files);
      },
      pause: () => {
        paused.current = true;
      }
    }),
    [enqueue]
  );

  return { items, ...actions };
}
