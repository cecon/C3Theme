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
  /** Orientar o turno em andamento com a mensagem (ADR 0008). Sem isso, a fila não tem Orientar. */
  steer?: (text: string, files: File[]) => void;
}

let seq = 0;

/**
 * Fila da próxima mensagem, como nos assistentes de IA: o que se escreve enquanto o assistente responde entra na
 * fila e sai sozinho quando a resposta termina, uma por vez. Dá para editar, tirar ou mandar na hora. Depois de
 * `pause` (o usuário apertou Parar), a fila não sai sozinha na próxima parada: quem parou quer decidir.
 */
export default function useMessageQueue({ generating, send, conversationId, steer }: UseMessageQueueOptions) {
  const [items, setItems] = useState<QueuedMessage[]>([]);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const paused = useRef(false);
  const was = useRef(generating);
  const sendRef = useRef(send);
  sendRef.current = send;
  const steerRef = useRef(steer);
  steerRef.current = steer;

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

  /** Tira da fila e manda por `to`; sem `to` ou sem o item, fica como está. */
  const take = useCallback((id: string, to: ((text: string, files: File[]) => void) | undefined) => {
    const item = itemsRef.current.find((q) => q.id === id);
    if (!item || !to) return false;
    setItems((list) => list.filter((q) => q.id !== id));
    to(item.text, item.files);
    return true;
  }, []);

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
      sendNow: (id: string) => take(id, sendRef.current),
      /** Orienta o turno em andamento com a mensagem: sai da fila e entra no turno (sem `steer`, não faz nada). */
      steer: (id: string) => take(id, steerRef.current),
      /** Orienta com a primeira da fila (Ctrl+Enter com a caixa vazia). Devolve se havia uma. */
      steerNext: () => {
        const [first] = itemsRef.current;
        return first !== undefined && take(first.id, steerRef.current);
      },
      pause: () => {
        paused.current = true;
      }
    }),
    [enqueue, take]
  );

  return { items, canSteer: steer !== undefined, ...actions };
}
