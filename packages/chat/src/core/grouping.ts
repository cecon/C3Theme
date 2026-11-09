// Como as mensagens se juntam na tela: separador por dia e balões seguidos do mesmo autor.

import type { Message } from './types';

/** Intervalo máximo para dois balões do mesmo autor ficarem colados (sem repetir nome e avatar). */
export const GROUP_GAP_MS = 5 * 60 * 1000;

/** Dia local (AAAA-MM-DD) de uma data ISO, para o separador "Hoje", "Ontem", "12 de março". */
export function localDay(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** A mensagem começa um dia novo em relação à anterior. */
export const startsDay = (prev: Message | undefined, msg: Message) => !prev || localDay(prev.createdAt) !== localDay(msg.createdAt);

/** Aviso no meio da conversa (sistema, passagem de tarefa): sem balão, quebra o bloco. */
const isMarker = (m: Message) => m.kind === 'system' || m.kind === 'handoff';

/** A mensagem continua o bloco da anterior: mesmo autor, mesmo dia, pouco tempo depois, e nenhuma é aviso. */
export function continuesGroup(prev: Message | undefined, msg: Message, gapMs = GROUP_GAP_MS): boolean {
  if (!prev || isMarker(prev) || isMarker(msg)) return false;
  if (prev.author.id !== msg.author.id || startsDay(prev, msg)) return false;
  return Date.parse(msg.createdAt) - Date.parse(prev.createdAt) <= gapMs;
}
