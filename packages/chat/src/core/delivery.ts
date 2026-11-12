import type { Message } from './types';

/** Entrega em um canal externo; independente do envio da pergunta para o agente (`Message.status`). */
export interface MessageDelivery {
  situacao: 'enviada' | 'entregue' | 'lida' | 'falhou';
  motivo?: string | null;
}

/** Só respostas de agente representam entrega externa; avisos, handoffs e pessoas não recebem a marca. */
export function isDeliveryMessage(message: Message): boolean {
  return message.direction === 'in' && message.author.kind !== 'person' && message.kind !== 'system' && message.kind !== 'handoff';
}

/** O resumo da tela preenche apenas a última resposta; a entrega da mensagem tem precedência. */
export function withLastDelivery(messages: Message[], delivery?: MessageDelivery): Message[] {
  if (!delivery) return messages;
  const last = messages.findLastIndex(isDeliveryMessage);
  if (last < 0 || messages[last].entrega) return messages;
  return messages.map((message, i) => (i === last ? { ...message, entrega: delivery } : message));
}
