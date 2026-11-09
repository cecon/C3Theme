// O que um renderizador de parte recebe do chat. Mesma forma do `UiPartProps` do @c3theme/chat, declarada aqui para
// o motor não depender do pacote de chat (o app liga os dois).

export interface AgentAnswer {
  action: 'accept' | 'decline' | 'cancel' | 'undo';
  values?: Record<string, unknown>;
}

export interface AgentPartProps {
  part: { id: string; kind: string; payload: unknown; state?: string; result?: unknown; reason?: string };
  /** Ainda aceita resposta. */
  open: boolean;
  /** Devolve se o servidor do chat aceitou a resposta. */
  onAnswer?: (answer: AgentAnswer) => Promise<boolean>;
}

/** Resumo depois de responder. */
export const STATE_LABEL: Record<string, string> = {
  submitted: 'Enviado',
  declined: 'Recusado',
  cancelled: 'Fechado sem resposta',
  expired: 'Expirou',
  undone: 'Desfeito'
};

/** Fechada sem resposta, com o motivo que o chat informou (só uma parte fica pendente por conversa). */
const REASON_LABEL: Record<string, string> = {
  superseded: 'Esta pergunta foi substituída por uma mais nova.',
  agent: 'O assistente cancelou esta pergunta.'
};

/** O resumo de uma parte que não está mais aberta e não foi enviada. */
export const stateLabel = (part: AgentPartProps['part']) =>
  (part.state === 'cancelled' && part.reason && REASON_LABEL[part.reason]) || STATE_LABEL[part.state ?? 'expired'] || STATE_LABEL.expired;
