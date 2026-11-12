// Painel por resumo (#108): widgets que leem um documento calculado pelo sistema (GET {source.path}), sem entidade.
// Sem React: a tela fica em pages/dashboard/summary.

import { conditionFields, evaluate, type FieldType } from './conditions.mjs';
import type { Condition, Text, Tone } from './types';

/** Endpoint do resumo: GET devolve `{ data: {...} }`. `refresh` relê a cada N segundos (o "baixando 40%"). */
export interface SummarySource {
  path: string;
  refresh?: number;
}

/** Como mostrar um valor do resumo. `money` usa a moeda ISO 4217 de `currency` (caminho no item). */
export type SummaryFormat = 'number' | 'percent' | 'money' | 'datetime' | 'text';

export interface SummaryDetail {
  label: Text;
  /** Caminho no item (`janela.inicio`). */
  value: string;
  format?: SummaryFormat;
  currency?: string;
}

interface SummaryBase {
  title: Text;
  subtitle?: Text;
  /** Outro resumo só para este widget; sem ele, o `source` do painel. */
  source?: SummarySource;
  /** Caminho no resumo: lista (um bloco por item) ou objeto (um bloco). */
  from: string;
  width?: number;
  /** Texto sem itens. Padrão: "Nada por aqui." */
  empty?: Text;
}

/** Uso com limite (tokens por provedor): valor, limite, % na barra e os detalhes de cada item. */
export interface MeterWidget extends SummaryBase {
  type: 'meter';
  label: string;
  value: string;
  /** Sem limite no item, mostra só o valor. */
  limit?: string;
  format?: SummaryFormat;
  details?: SummaryDetail[];
}

/** Participação no total (consumo por agente), em ranking com barras ou rosca. */
export interface ShareWidget extends SummaryBase {
  type: 'share';
  label: string;
  value: string;
  /** Participação já calculada (0 a 100); sem ela, o valor sobre a soma dos itens. */
  share?: string;
  format?: SummaryFormat;
  chart?: 'ranking' | 'donut';
  limit?: number;
}

export interface StatusState {
  label: Text;
  tone?: Tone;
}

export interface StatusAction {
  id: string;
  label: Text;
  /** POST para o sistema; a resposta `{ data }`, quando vem, é o resumo novo. */
  path: string;
  variant?: 'contained' | 'outlined';
}

/** Objeto único com estado, textos e ações (o card de atualização do app). */
export interface StatusWidget extends SummaryBase {
  type: 'status';
  /** Caminho do estado no objeto; o valor escolhe em `states` o rótulo e a cor. */
  state: string;
  states: Record<string, StatusState>;
  fields?: SummaryDetail[];
  /** Caminho de um número de 0 a 100: a barra aparece quando ele vem. */
  progress?: string;
  /** Caminho do texto de erro do sistema, mostrado quando vem. */
  message?: string;
  notices?: { when: Condition; text: Text; tone?: 'info' | 'warning' | 'error' }[];
  actions?: StatusAction[];
  /**
   * Caminho do objeto `{ [id]: { disabled?, instruction? } }` em que o sistema diz que ações valem agora. Ação fora
   * dele não aparece; sem ele no objeto, todas aparecem habilitadas. Padrão `actions`.
   */
  availability?: string;
}

export type SummaryWidget = MeterWidget | ShareWidget | StatusWidget;

export const SUMMARY_TYPES = new Set<string>(['meter', 'share', 'status']);

export function isSummaryWidget(w: { type: string }): w is SummaryWidget {
  return SUMMARY_TYPES.has(w.type);
}

/** Valor no caminho com pontos (`janela.inicio`); qualquer passo ausente dá `undefined`. */
export function pick(obj: unknown, path: string): unknown {
  let cur = obj;
  for (const key of path.split('.')) {
    if (cur === null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}

/** Itens do widget: a lista do caminho, ou o objeto como item único; o resto, nenhum. */
export function itemsAt(summary: unknown, from: string): Record<string, unknown>[] {
  const v = pick(summary, from);
  if (Array.isArray(v)) return v.filter((i): i is Record<string, unknown> => i !== null && typeof i === 'object');
  return v !== null && typeof v === 'object' ? [v as Record<string, unknown>] : [];
}

const asNumber = (v: unknown) => (typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN);

/** Número do item, ou `undefined` quando não vem ou não é número. */
export function numberAt(item: unknown, path: string | undefined): number | undefined {
  if (!path) return undefined;
  const n = asNumber(pick(item, path));
  return Number.isFinite(n) ? n : undefined;
}

/** Valor formatado para a tela; vazio quando o item não traz. */
export function formatSummary(v: unknown, format: SummaryFormat = 'number', locale: string, currency?: unknown): string {
  if (v === undefined || v === null || v === '') return '';
  const n = asNumber(v);
  if (format === 'text' || (format !== 'datetime' && !Number.isFinite(n))) return String(v);
  if (format === 'datetime') {
    const d = new Date(String(v));
    return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' });
  }
  if (format === 'percent') return `${n.toLocaleString(locale, { maximumFractionDigits: 1 })}%`;
  if (format === 'money' && typeof currency === 'string' && /^[A-Z]{3}$/.test(currency))
    return n.toLocaleString(locale, { style: 'currency', currency });
  return n.toLocaleString(locale);
}

/** % do limite (pode passar de 100: estourou) e a cor: até 80 normal, até 100 atenção, acima perigo. */
export function meterLevel(value: number, limit: number): { pct: number; tone: Tone } {
  const pct = limit > 0 ? (value / limit) * 100 : 0;
  return { pct, tone: pct > 100 ? 'danger' : pct >= 80 ? 'warning' : 'primary' };
}

/** Participação de cada item (0 a 100): a declarada, ou o valor sobre a soma. Maiores primeiro. */
export function shares(w: ShareWidget, items: Record<string, unknown>[]) {
  const rows = items.map((i) => ({ item: i, label: String(pick(i, w.label) ?? ''), value: numberAt(i, w.value) ?? 0 }));
  const total = rows.reduce((s, r) => s + r.value, 0);
  return rows
    .map((r) => ({ ...r, share: numberAt(r.item, w.share) ?? (total > 0 ? (r.value / total) * 100 : 0) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, w.limit ?? rows.length);
}

export interface ActionState {
  action: StatusAction;
  disabled: boolean;
  instruction?: string;
}

/** Ações que o sistema libera agora, na ordem da spec; a desabilitada leva a instrução que o sistema mandou. */
export function statusActions(w: StatusWidget, item: Record<string, unknown>): ActionState[] {
  const avail = pick(item, w.availability ?? 'actions');
  const map = avail !== null && typeof avail === 'object' ? (avail as Record<string, unknown>) : undefined;
  return (w.actions ?? []).flatMap((action): ActionState[] => {
    if (!map) return [{ action, disabled: false }];
    const a = map[action.id];
    if (a === undefined || a === null || typeof a !== 'object') return a === true ? [{ action, disabled: false }] : [];
    const { disabled, instruction } = a as { disabled?: unknown; instruction?: unknown };
    return [{ action, disabled: disabled === true, instruction: typeof instruction === 'string' ? instruction : undefined }];
  });
}

/** Tipo de cada campo da condição pelo valor que veio no objeto (o resumo não tem entidade que diga). */
function typesOf(cond: Condition, item: Record<string, unknown>): Record<string, FieldType> {
  const types: Record<string, FieldType> = {};
  for (const { field } of conditionFields(cond)) {
    const v = item[field];
    types[field] = typeof v === 'number' ? 'integer' : typeof v === 'boolean' ? 'boolean' : 'string';
  }
  return types;
}

/** Avisos cujo `when` vale no objeto (o canal beta). */
export function statusNotices(w: StatusWidget, item: Record<string, unknown>) {
  return (w.notices ?? []).filter((n) => evaluate(n.when, item, typesOf(n.when, item)));
}
