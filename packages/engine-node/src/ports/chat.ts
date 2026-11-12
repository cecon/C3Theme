// Porta do chat com o agente (`pages[].chat`, `layout.header.assistant`; spec/v0/chat.yaml, ADR 0006): o agente é do
// sistema, que guarda as conversas e fala com o modelo. Sem ela, as rotas /_chat respondem 404. A resposta sai pela
// `ChatRoom` que cada chamada recebe (guarde e responda depois).

import type { Rec } from '../domain/types';
import type { EngineRequest } from './request';

/** Uma página do histórico, da mais antiga para a mais nova (`Message` do @c3theme/chat, em JSON). */
export interface ChatPage {
  messages: Rec[];
  /** Há mensagens mais antigas que estas. */
  hasMore: boolean;
}

/** O que o usuário mandou (POST /_chat/{conversation}/messages), já conferido. */
export interface Outgoing {
  /** Id gerado no navegador: a mensagem gravada volta com ele. */
  clientId: string;
  text: string;
  replyTo?: string;
  /** Parte que esperava resposta quando o usuário digitou (`{ messageId, partId, kind, version? }`). */
  pendingPart?: Rec;
}

/** A conversa de um usuário: por onde o agente responde. */
export interface ChatRoom {
  readonly audience: string;
  readonly conversation: string;
  /** Outra conversa do mesmo usuário, para começar a resposta de uma filha. */
  inConversation(conversation: string): ChatRoom;
  /** Mensagem nova ou atualizada (o `conversationId` é o da sala). */
  message(message: Rec): void;
  /** Pedaço de texto da resposta `id` (que já saiu com `streaming: true`); `done` encerra. */
  delta(id: string, text: string, done?: boolean): void;
  /** Qualquer `ChatEvent` (`message`, `delta`, `typing`, `removed`, `ui.cancel`). Tipo desconhecido lança. */
  emit(event: Rec): void;
}

type Maybe<T> = Promise<T> | T;

export interface Chat {
  /** Conversas filhas visíveis ao usuário da sala; sem implementação o recurso responde 404. */
  lanes?(room: ChatRoom): Maybe<Rec[]>;
  /** Abra uma filha do usuário da sala; branch precisa copiar apenas até a mensagem de origem. */
  openLane?(room: ChatRoom, input: { kind: 'aside' | 'branch'; fromMessageId?: string; text?: string }): Maybe<Rec>;
  /** Ações declaradas para a mensagem; confira declaração e acesso antes de executar. */
  messageAction?(room: ChatRoom, messageId: string, actionId: string): Maybe<Rec>;
  /** De quem é a conversa deste pedido (o id do usuário logado). A autenticação já passou pelo sistema. */
  audience(req: EngineRequest): string;
  /** Sem `before`, as `limit` mais recentes; com `before` (id de mensagem), as anteriores a ela. */
  history(room: ChatRoom, before: string | undefined, limit: number): Maybe<ChatPage>;
  /** Grava a mensagem do usuário e devolve como ficou (com o `clientId`). A resposta vai pela `room`. */
  send(room: ChatRoom, message: Outgoing): Maybe<Rec>;
  /** Para a resposta em andamento. Sem isso, não faz nada. */
  stop?(room: ChatRoom): Maybe<void>;
  /** Resposta (ou dispensa) da pergunta da mensagem (`QuestionAnswer`). Já respondida: lance 409. */
  answer(room: ChatRoom, messageId: string, answer: Rec): Maybe<void>;
  /** Resposta de uma parte (`UiAnswer`, `action` já conferida). Parte fechada ou de outra versão: lance 409. */
  answerUi(room: ChatRoom, messageId: string, partId: string, answer: Rec): Maybe<void>;
}
