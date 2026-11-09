// Parte de interface que o assistente põe numa mensagem (formulário, rascunho de registro, confirmação de ação).
// O chat não interpreta o conteúdo: só guarda o estado e entrega ao renderizador registrado para o `kind`
// (catálogo fechado do app, ex.: o do @c3theme/engine). Nada de HTML ou código vindo do modelo. Puro: sem React.

/** Situação da parte. `undone`: o que foi gravado pela parte foi desfeito depois. */
export type UiPartState = 'pending' | 'submitted' | 'declined' | 'cancelled' | 'expired' | 'undone';

/**
 * Por que a parte foi fechada sem resposta do usuário. `superseded`: o assistente mandou outra parte (só uma fica
 * pendente por conversa); `agent`: o assistente desistiu dela (evento `ui.cancel`); `expired`: passou do prazo.
 */
export type UiCancelReason = 'superseded' | 'agent' | 'expired';

export interface UiPart {
  id: string;
  /** Tipo no catálogo do app, ex.: "c3.form". Sem renderizador para ele, o chat avisa que não sabe mostrar. */
  kind: string;
  /** Conteúdo do renderizador; ele mesmo confere o formato. */
  payload: unknown;
  /** Padrão: `pending`. */
  state?: UiPartState;
  /** O que foi enviado ou gravado, para o resumo depois de responder. */
  result?: unknown;
  /** Depois disso (ISO 8601), a parte não aceita mais resposta. */
  expiresAt?: string;
  /**
   * Versão da parte no servidor: sobe quando o assistente a reenvia mudada. Vai junto da resposta, e o servidor
   * recusa (409) resposta a uma versão velha.
   */
  version?: number;
  /** Fechada sem resposta (`cancelled` ou `expired`): o motivo, para o card dizer o que houve. */
  reason?: UiCancelReason;
}

/**
 * Resposta do usuário. As três primeiras são as do MCP elicitation e do AG-UI: `accept` (enviou), `decline`
 * (recusou: "Agora não"), `cancel` (fechou sem escolher). `undo`: desfez o que a parte gravou.
 */
export interface UiAnswer {
  action: 'accept' | 'decline' | 'cancel' | 'undo';
  /** Valores enviados (`accept`) ou o que foi gravado (id, título). */
  values?: Record<string, unknown>;
  /** Versão da parte que o usuário viu (`UiPart.version`). Quem preenche é o `useMessageWindow`. */
  version?: number;
}

const NEXT_STATE: Record<UiAnswer['action'], UiPartState> = {
  accept: 'submitted',
  decline: 'declined',
  cancel: 'cancelled',
  undo: 'undone'
};

/** Estado da parte depois da resposta. */
export const stateAfter = (answer: UiAnswer): UiPartState => NEXT_STATE[answer.action];

/** Ainda espera resposta: pendente e dentro do prazo. */
export function isPartOpen(part: UiPart, now = Date.now()): boolean {
  if ((part.state ?? 'pending') !== 'pending') return false;
  return !part.expiresAt || Date.parse(part.expiresAt) > now;
}

/** A parte com a resposta aplicada (otimista, antes do servidor confirmar). */
export function answerPart(part: UiPart, answer: UiAnswer): UiPart {
  return { ...part, state: stateAfter(answer), result: answer.values ?? part.result };
}

/** A parte fechada sem resposta do usuário: `expired` pelo prazo, `cancelled` pelos outros motivos. */
export function cancelPart(part: UiPart, reason: UiCancelReason): UiPart {
  return { ...part, state: reason === 'expired' ? 'expired' : 'cancelled', reason };
}
