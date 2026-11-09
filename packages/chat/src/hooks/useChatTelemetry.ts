import { useEffect, useRef } from 'react';

import { newTaskWatch, watchTasks, type ChatTelemetryPort, type TaskOf } from '../core/telemetry';
import type { Message } from '../core/types';

/**
 * Emite os eventos de tarefa das partes de interface pela porta do app, olhando as mensagens (não os cards, que a
 * lista virtual monta e desmonta ao rolar). Trocar de conversa não é abandono: a parte continua pendente lá.
 */
export default function useChatTelemetry(
  conversationId: string | undefined,
  messages: Message[],
  port: ChatTelemetryPort | undefined,
  taskOf: TaskOf | undefined
) {
  const watch = useRef(newTaskWatch());
  const sink = useRef(port);
  useEffect(() => {
    sink.current = port;
  }, [port]);

  useEffect(() => {
    watch.current = newTaskWatch();
  }, [conversationId]);

  useEffect(() => {
    if (!taskOf || !sink.current) return;
    // na troca de conversa, as mensagens da anterior ainda podem estar aqui por um render
    const current = messages.filter((m) => m.conversationId === conversationId);
    for (const event of watchTasks(watch.current, current, taskOf)) {
      try {
        sink.current(event);
      } catch {
        // a porta é do app; falha dela não quebra o chat
      }
    }
  }, [conversationId, messages, taskOf]);
}
