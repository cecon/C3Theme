// Orientar o turno em andamento (ADR 0008): o que cada tecla faz na caixa do assistente e quais mensagens ainda
// esperam o agente ler. Puro: sem React e sem rede.

import type { Message } from './types';

/** Como a pessoa envia: `enter` (Shift+Enter quebra a linha) ou `modEnter` (Ctrl+Enter, ⌘+Enter no Mac; Enter quebra). */
export type SendKey = 'enter' | 'modEnter';

/** A tecla apertada na caixa. `mod`: Ctrl ou ⌘. */
export interface KeyPress {
  key: string;
  shift: boolean;
  mod: boolean;
  /** Compondo acento ou ideograma (IME): a tecla é do teclado, não da caixa. */
  composing: boolean;
}

export interface ComposerKeyState {
  sendKey: SendKey;
  /** Há turno em andamento (o agente está respondendo). */
  busy: boolean;
  /** A conversa orienta (`steer` ligado). */
  canSteer: boolean;
  /** Dá para parar a resposta. */
  canStop: boolean;
}

/**
 * O que a tecla faz: `send` (envia, ou põe na fila com o agente ocupado), `steer` (orienta o turno em andamento),
 * `stop` (para a resposta) ou `none` (a caixa segue o normal: quebra a linha, digita). Ctrl+Enter orienta nos dois
 * modos, mas só enquanto há turno; sem turno, envia.
 */
export function composerKey(k: KeyPress, s: ComposerKeyState): 'send' | 'steer' | 'stop' | 'none' {
  if (k.composing) return 'none';
  if (k.key === 'Escape') return s.busy && s.canStop ? 'stop' : 'none';
  if (k.key !== 'Enter' || k.shift) return 'none';
  if (k.mod) return s.busy && s.canSteer ? 'steer' : 'send';
  return s.sendKey === 'enter' ? 'send' : 'none';
}

/** Orientação que o agente ainda não leu: mostrada na fila, não na conversa. */
export const isSteering = (m: Message) => m.direction === 'out' && m.steer === 'pending';

/** Separa as orientações que esperam o agente (vão para a fila) do resto (a conversa). */
export function splitSteering(messages: Message[]): { shown: Message[]; steering: Message[] } {
  const steering = messages.filter(isSteering);
  return steering.length ? { shown: messages.filter((m) => !isSteering(m)), steering } : { shown: messages, steering };
}
