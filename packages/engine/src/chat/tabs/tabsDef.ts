// Abas das threads da conversa (`$defs/chatTabs`, #134; ADR 0016): da declaração e das conversas à parte para a
// faixa de abas do @c3theme/ui. Puro.

import type { ThreadTab, ThreadTabState } from '@c3theme/ui';

import type { WireLane } from '../../agent/lanes';
import type { Text } from '../../types';

/** `$defs/chatTabs`. */
export interface ChatTabsDef {
  /** Nome acessível da faixa. Padrão: "Threads da conversa". */
  label?: Text;
  /** Título da aba da thread principal. Padrão: o título do chat. */
  main?: Text;
  /** Botão "+" de thread nova. Padrão: ligado. */
  new?: boolean;
  /** Atalhos na forma canônica do `format: "shortcut"` ("Ctrl+Shift+K"). Ausentes: sem atalho. */
  shortcuts?: { next?: string; previous?: string; new?: string; close?: string };
}

/** Id da aba da thread principal: nunca colide com id de conversa (que não aceita ":"). */
export const MAIN_TAB = 'c3:main';
/** Prefixo das threads novas ainda sem mensagem (não ficam guardadas entre reinícios). */
export const DRAFT_PREFIX = 'c3:draft:';
export const isDraft = (id: string) => id.startsWith(DRAFT_PREFIX);

/** O que a aba mostra: falha, depois aguardando a pessoa, executando e resposta nova. */
export function laneState(lane: WireLane): ThreadTabState | undefined {
  if (lane.failed) return 'failed';
  if (lane.attention) return 'waiting';
  if (lane.working) return 'running';
  return lane.unread > 0 ? 'unread' : undefined;
}

/** A aba de uma thread lateral, com o nome que a pessoa deu por cima do título do sistema. */
export function laneTab(lane: WireLane, names: Record<string, string>): ThreadTab {
  return {
    id: lane.id,
    label: (Object.hasOwn(names, lane.id) ? names[lane.id] : undefined) ?? lane.title,
    state: laneState(lane),
    ...(lane.unavailable && { disabled: lane.unavailable })
  };
}

/** Atalho declarado → ação. Campo de texto e composição de acento/IME não disparam. */
export function shortcutAction(
  shortcuts: ChatTabsDef['shortcuts'],
  pressed: string | undefined,
  target: EventTarget | null,
  composing: boolean
): keyof NonNullable<ChatTabsDef['shortcuts']> | undefined {
  if (!shortcuts || !pressed || composing || typing(target)) return undefined;
  return (Object.keys(shortcuts) as (keyof typeof shortcuts)[]).find((k) => shortcuts[k] === pressed);
}

const typing = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
