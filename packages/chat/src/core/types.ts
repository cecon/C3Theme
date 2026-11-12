// Contrato de mensagens do C3 Chat. Serve para conversa entre pessoas e para assistente de IA: o que é de IA
// (resposta chegando aos pedaços, ferramentas consultadas, markdown) é opcional e não atrapalha quem não usa. O
// resto específico do app (WhatsApp, helpdesk) vai em `meta`. Datas em ISO 8601 (texto), como no fio.

import type { AgentQuestion } from './question';
import type { Handoff } from './team';
import type { UiPart } from './ui';
import type { PendingPart } from './uiPending';
import type { MessageDelivery } from './delivery';

/** Quem escreveu. */
export interface Author {
  id: string;
  name: string;
  avatarUrl?: string;
  /**
   * `agent`: agente de IA (numa conversa com vários, cada um com nome, cor e avatar no próprio bloco); `person`:
   * gente. Sem isso, a lista trata como antes (no `variant="assistant"`, quem chega é o assistente).
   */
  kind?: 'person' | 'agent';
  /** Cor do autor (CSS), na marca ao lado do nome e no avatar padrão. O nome em si fica na cor do texto (contraste). */
  color?: string;
}

/**
 * Situação de uma mensagem que eu enviei. `sending` e `failed` só existem no cliente (envio otimista); as demais
 * vêm do servidor.
 */
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface Attachment {
  id: string;
  name: string;
  /** Tamanho em bytes. */
  size: number;
  /** Tipo MIME, ex.: "image/jpeg", "audio/ogg". */
  contentType: string;
  /** Onde baixar; sem isso, o arquivo ainda não está disponível (ex.: enviando). */
  url?: string;
  thumbnailUrl?: string;
  /** Áudio e vídeo: duração em milissegundos. */
  durationMs?: number;
}

/** Ferramenta que o assistente chamou para responder ("Consultou: estoque, rotas"). */
export interface ToolCall {
  id: string;
  /** Nome técnico, ex.: "nati_consultar". */
  name: string;
  /** Nome para gente, ex.: "Consultar cadastro". Sem isso, mostra o `name`. */
  label?: string;
  status: 'running' | 'done' | 'error';
  /** O que o assistente mandou para a ferramenta (texto já formatado pelo app, ex.: JSON indentado). */
  input?: string;
  /** O que a ferramenta devolveu, ou o erro. Some na tela se for grande: fica atrás do "ver detalhes". */
  output?: string;
  /** Quanto a etapa levou, em milissegundos. Sem isso, a etapa não mostra tempo. */
  durationMs?: number;
}

export interface Message {
  /** Id do servidor. Na mensagem otimista (ainda enviando), é igual ao `clientId`. */
  id: string;
  /** Id gerado no cliente ao enviar; o servidor devolve igual, e é por ele que a resposta substitui a otimista. */
  clientId?: string;
  conversationId: string;
  author: Author;
  /** `out`: eu (ou meu lado: atendente, robô) enviei; `in`: recebi. */
  direction: 'in' | 'out';
  /**
   * `system`: aviso da conversa ("Ana entrou"), sem balão. `handoff`: um agente passou tarefa para outro (vem em
   * `handoff`); sai como linha centralizada com os dois avatares.
   */
  kind?: 'text' | 'system' | 'handoff';
  /** A passagem de tarefa, quando `kind: 'handoff'`. */
  handoff?: Handoff;
  text?: string;
  /** Como ler o `text`. `markdown`: negrito, listas, tabelas, código (sem HTML). Padrão: texto puro. */
  format?: 'plain' | 'markdown';
  /**
   * A resposta ainda está sendo escrita (assistente). Sem texto ainda, aparece "Pensando…"; com texto, um cursor
   * no fim. Os pedaços chegam pelo evento `delta`.
   */
  streaming?: boolean;
  /** Ferramentas que o assistente usou (ou está usando) nesta resposta, na ordem em que rodaram. */
  tools?: ToolCall[];
  /**
   * Raciocínio do assistente ("o que ele está pensando"), em texto. Chega aos pedaços pelo `delta` com
   * `channel: 'reasoning'` e aparece na área de trabalho, recolhível.
   */
  reasoning?: string;
  /** Pergunta do assistente ao usuário, em card com opções; o `text` acima é o contexto. */
  question?: AgentQuestion;
  /**
   * Telas que o assistente pede para o usuário preencher ou confirmar (formulário, rascunho de registro, ação), na
   * ordem. Quem desenha é o renderizador do `kind` que o app registrou; o chat só guarda o estado.
   */
  ui?: UiPart[];
  /** Quanto tempo pensou, em milissegundos ("Pensou por 4 s"). Sem isso, a tela mede enquanto acompanha. */
  reasoningMs?: number;
  attachments?: Attachment[];
  createdAt: string;
  status?: MessageStatus;
  /** Entrega da resposta do agente em um canal externo, sem alterar o envio da pergunta no chat. */
  entrega?: MessageDelivery;
  /** Id da mensagem respondida. */
  replyTo?: string;
  /**
   * Orientação: mensagem minha que entra no turno em andamento do agente, sem interromper (ADR 0008). `pending`: espera
   * o agente chegar a um ponto em que lê (fica na fila como "Orientando" e ainda dá para remover); `taken`: o agente
   * leu (fica na conversa com a marca "Orientou").
   */
  steer?: 'pending' | 'taken';
  /** Dados do app, que o contrato não interpreta. */
  meta?: Record<string, unknown>;
}

export interface Conversation {
  id: string;
  title: string;
  subtitle?: string;
  avatarUrl?: string;
  unread: number;
  lastMessage?: Pick<Message, 'text' | 'createdAt' | 'direction' | 'attachments' | 'author'>;
  updatedAt: string;
  pinned?: boolean;
  muted?: boolean;
  meta?: Record<string, unknown>;
}

/** O que o cliente manda para enviar. Arquivos vão crus; quem sobe é o transporte do app. */
export interface OutgoingMessage {
  clientId: string;
  conversationId: string;
  text?: string;
  files?: Blob[];
  replyTo?: string;
  /**
   * Parte de interface que esperava resposta quando o usuário digitou: vai no contexto para o assistente decidir se a
   * mantém (não manda nada sobre ela) ou a cancela (`ui.cancel`). Quem preenche é o `useMessageWindow`.
   */
  pendingPart?: PendingPart;
  /** Orientar: entra no turno em andamento, sem interromper (ADR 0008). O servidor devolve com `steer: 'pending'`. */
  steer?: boolean;
}
