// Peças do painel do agente (o que fez, o que está fazendo, por que parou): contrato e regras puras, sem React.
import { localDay } from './grouping';

/** Tom do cartão "Fazendo agora" / "Esperando": cor semântica só para o que pede atenção. */
export type AgentNowTone = 'neutral' | 'working' | 'waiting' | 'error' | 'done';

/** Tipo de evento na linha do tempo: decide o ícone. */
export type AgentEventKind = 'received' | 'tool' | 'delegated' | 'replied' | 'error';

export interface AgentEvent {
  id: string;
  /** Quando aconteceu (ISO 8601). */
  at: string;
  kind: AgentEventKind;
  /** Texto curto já pronto pelo app ("Pediu à Cozinha para confirmar o estoque"). */
  text: string;
}

export interface AgentFile {
  id: string;
  name: string;
  /** Tamanho em bytes; sem ele a linha só mostra o nome. */
  size?: number;
}

/** Linha da linha do tempo: o evento, com o dia quando ele muda (ou quando o primeiro não é de hoje). */
export interface TimelineRow {
  event: AgentEvent;
  /** ISO do primeiro evento do dia, para o separador; ausente quando o dia é o mesmo da linha anterior. */
  day?: string;
}

/**
 * Monta as linhas na ordem recebida (o app manda do mais novo para o mais antigo, como o painel mostra). O separador de
 * dia só aparece quando o dia muda, e no começo só se a lista não for de hoje: um dia só, de hoje, fica sem separador.
 */
export function timelineRows(events: AgentEvent[], now: Date = new Date()): TimelineRow[] {
  const today = localDay(now.toISOString());
  let prev: string | undefined;
  return events.map((event) => {
    const day = localDay(event.at);
    const changed = prev === undefined ? day !== today : day !== prev;
    prev = day;
    return changed ? { event, day: event.at } : { event };
  });
}

/** Porcentagem inteira entre 0 e 100 (número fora da faixa ou inválido vira o limite mais perto). */
export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(Math.min(100, Math.max(0, value)));
}

/** Nível do medidor de contexto: avisa a 10 pontos do resumo automático (sem limite, a partir de 90%). */
export function contextLevel(used: number, summarizeAt?: number): 'ok' | 'near' {
  const limit = summarizeAt === undefined ? 100 : clampPercent(summarizeAt);
  return clampPercent(used) >= limit - 10 ? 'near' : 'ok';
}
