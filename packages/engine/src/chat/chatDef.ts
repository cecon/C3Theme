// `$defs/chat` do app.json (`pages[].chat`, `layout.header.assistant`; ADR 0006) em props do AssistantPanel. Puro.

import type { SendKey } from '@c3theme/chat';

import type { Text } from '../types';
import type { ChatLanesSpec } from '../agent/lanes';

/** Partes do catálogo fechado (spec/v0/agent-ui.schema.json). */
export const AGENT_KINDS = ['c3.form', 'c3.record', 'c3.action', 'c3.tool', 'c3.plan', 'c3.browser'] as const;
export type AgentKind = (typeof AGENT_KINDS)[number];

/** Conversa com o agente do sistema, como no app.json. */
export interface ChatDef extends ChatLanesSpec {
  /** Id da conversa nas rotas (/_chat/{conversation}). Padrão: "assistant". */
  conversation?: string;
  /** Título do painel e do botão do header. Padrão: "Assistente". */
  title?: Text;
  placeholder?: Text;
  /** Perguntas prontas da conversa vazia. */
  suggestions?: Text[];
  /** Partes que esta conversa desenha. Ausente: todas. */
  parts?: AgentKind[];
  /** Fila da próxima mensagem enquanto o agente responde. Padrão: ligada. */
  queue?: boolean;
  /** Como a pessoa envia: `enter` (padrão) ou `modEnter` (Ctrl+Enter, ⌘+Enter no Mac). */
  sendKey?: SendKey;
  /** Orientar o turno em andamento (ADR 0008): Ctrl+Enter com o agente ocupado e Orientar na fila. Padrão: desligado. */
  steer?: boolean;
}

/** `layout.header.assistant`: `true` vale o padrão; `false`, ausente ou outra coisa, sem botão. */
export function headerChat(raw: ChatDef | boolean | undefined): ChatDef | null {
  if (raw === true) return {};
  return raw && typeof raw === 'object' ? raw : null;
}

/** O que o painel mostra, já traduzido. */
export interface ChatView {
  conversation: string;
  title: string;
  placeholder?: string;
  suggestions: string[];
  queue: boolean;
  sendKey: SendKey;
  steer: boolean;
}

export function chatView(def: ChatDef, text: (t: Text | undefined, fallback?: string) => string): ChatView {
  return {
    conversation: def.conversation ?? 'assistant',
    title: text(def.title, 'Assistente'),
    placeholder: def.placeholder === undefined ? undefined : text(def.placeholder),
    suggestions: (def.suggestions ?? []).map((s) => text(s)),
    queue: def.queue !== false,
    sendKey: def.sendKey === 'modEnter' ? 'modEnter' : 'enter',
    steer: def.steer === true
  };
}

/**
 * Catálogo do painel para `parts`: os renderizadores do motor que a conversa aceita e, para cada kind fora da lista,
 * um buraco (`undefined`), que tira também os de humano no circuito que o AssistantPanel já traz. Parte sem
 * renderizador aparece como "não sei mostrar".
 */
export function chatRenderers<R>(def: ChatDef, engine: Partial<Record<AgentKind, R>>): Record<string, R | undefined> {
  const allowed = new Set<string>(def.parts ?? AGENT_KINDS);
  const out: Record<string, R | undefined> = {};
  for (const kind of AGENT_KINDS) {
    if (!allowed.has(kind)) out[kind] = undefined;
    else if (engine[kind] !== undefined) out[kind] = engine[kind];
  }
  return out;
}
