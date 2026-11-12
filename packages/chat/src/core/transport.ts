import type { QuestionAnswer } from './question';
import type { Author, Message, OutgoingMessage } from './types';
import type { UiAnswer, UiCancelReason } from './ui';

/** Uma página de histórico, da mais antiga para a mais nova. */
export interface MessagePage {
  messages: Message[];
  /** Ainda há mensagens mais antigas que estas. */
  hasMore: boolean;
}

/** Algo que aconteceu numa conversa, empurrado pelo servidor (WebSocket, SSE, polling: o app escolhe). */
export type ChatEvent =
  /** Mensagem nova ou atualizada (ex.: status `read`). Repetir uma mensagem é seguro: entra uma vez só. */
  | { type: 'message'; message: Message }
  | { type: 'removed'; conversationId: string; id: string }
  /**
   * Pedaço de texto de uma resposta em andamento (assistente): soma ao fim do `text` da mensagem `id`, que já
   * chegou antes por `message` com `streaming: true`. `done` encerra a escrita. `channel: 'reasoning'` soma ao
   * raciocínio (`reasoning`) em vez da resposta.
   */
  | { type: 'delta'; conversationId: string; id: string; text: string; done?: boolean; channel?: 'text' | 'reasoning' }
  | { type: 'typing'; conversationId: string; author: Author; typing: boolean }
  /**
   * A parte `partId` (da mensagem `messageId`, se vier) deixou de esperar resposta: `superseded` (o assistente mandou
   * outra), `agent` (desistiu dela) ou `expired` (prazo). O card fecha dizendo o motivo.
   */
  | { type: 'ui.cancel'; conversationId: string; partId: string; messageId?: string; reason: UiCancelReason }
  /**
   * Aviso passageiro do sistema na conversa, com texto pronto (ex.: a orientação não pôde entrar no turno e o agente
   * vai parar e responder em seguida). Não é mensagem: não fica no histórico.
   */
  | { type: 'notice'; conversationId: string; text: string; tone?: NoticeTone };

/** Tom do aviso passageiro: `info` (padrão) ou `warning`. */
export type NoticeTone = 'info' | 'warning';

/**
 * Porta de saída do chat: o app do sistema implementa (HTTP, WebSocket, fila) e os hooks só falam com ela.
 * Nenhum hook faz `fetch` por conta própria.
 */
export interface ChatTransport {
  /** Histórico: sem `before`, as mais recentes; com `before` (id de mensagem), as anteriores a ela. */
  loadMessages(conversationId: string, page: { before?: string; limit: number }, signal?: AbortSignal): Promise<MessagePage>;
  /** Envia e devolve a mensagem gravada, com o mesmo `clientId`. Rejeitar marca a mensagem como `failed`. */
  send(message: OutgoingMessage): Promise<Message>;
  /** Passa a receber eventos da conversa; devolve como parar. */
  subscribe(conversationId: string, onEvent: (event: ChatEvent) => void): () => void;
  /** Avisa que estou digitando (ou parei). Opcional: sem isso, o "digitando…" só funciona na entrada. */
  sendTyping?(conversationId: string, typing: boolean): void;
  /** Pede para o assistente parar a resposta em andamento. Opcional: sem isso, o botão Parar não aparece. */
  stop?(conversationId: string): void;
  /**
   * Responde (ou dispensa) a pergunta que o assistente fez na mensagem `messageId`. Opcional: sem isso, o card de
   * pergunta só mostra, sem botões. Rejeitar desfaz a resposta otimista.
   */
  answer?(conversationId: string, messageId: string, answer: QuestionAnswer): Promise<void>;
  /**
   * Responde uma parte de interface (`message.ui`) da mensagem `messageId`: o que foi preenchido, gravado, recusado
   * ou desfeito volta para o assistente. `answer.version` é a versão que o usuário viu. Opcional: sem isso, as partes
   * só mostram. Rejeitar desfaz a resposta otimista; rejeitar com 409 (`UiConflictError` ou erro com `status: 409`),
   * porque a parte já não está pendente ou mudou de versão, fecha o card como substituído.
   */
  answerUi?(conversationId: string, messageId: string, partId: string, answer: UiAnswer): Promise<void>;
  /**
   * Tira uma mensagem minha que o agente ainda não leu (orientação `steer: 'pending'`). Opcional: sem isso, a
   * orientação esperando não tem Remover. Rejeitar (409: o agente já leu) devolve a mensagem.
   */
  remove?(conversationId: string, messageId: string): Promise<void>;
}

/** Onde o rascunho fica guardado entre aberturas da conversa. */
export interface DraftStorage {
  get(conversationId: string): string;
  set(conversationId: string, text: string): void;
}
