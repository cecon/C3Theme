// Plano que o agente propõe antes de começar (parte `c3.plan`): o humano desmarca passos, muda a ordem, reescreve o
// texto e aprova, ou recusa dizendo o porquê. Puro: sem React.

import type { UiAnswer, UiPart } from './ui';

export interface PlanStep {
  id: string;
  text: string;
  /** Uma linha a mais, apagada ("lê 120 faturas do mês"). */
  detail?: string;
  /** Não pode ser desmarcado (o passo que grava, o passo de conferência). */
  required?: boolean;
}

export interface PlanProposal {
  title?: string;
  steps: PlanStep[];
  /** O que o humano pode mudar. Padrão: tudo. */
  allow?: { edit?: boolean; reorder?: boolean; remove?: boolean };
}

/** Um passo no rascunho do humano: marcado ou não, com o texto que ele deixou. */
export interface DraftStep extends PlanStep {
  enabled: boolean;
}

export interface PlanResult {
  steps: { id: string; text: string }[];
  removed: string[];
  /** Mudou alguma coisa (ordem, texto ou passo desmarcado). */
  edited: boolean;
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

export function planAllows(p: PlanProposal) {
  const a = p.allow ?? {};
  return { edit: a.edit !== false, reorder: a.reorder !== false, remove: a.remove !== false };
}

export const planDraft = (p: PlanProposal): DraftStep[] => p.steps.map((s) => ({ ...s, enabled: true }));

/** Move o passo de `from` para `to` (fora dos limites, não muda nada). */
export function moveStep(steps: DraftStep[], from: number, to: number): DraftStep[] {
  if (from === to || from < 0 || to < 0 || from >= steps.length || to >= steps.length) return steps;
  const out = [...steps];
  const [s] = out.splice(from, 1);
  out.splice(to, 0, s);
  return out;
}

/** Marca ou desmarca; passo obrigatório fica marcado. */
export const toggleStep = (steps: DraftStep[], id: string): DraftStep[] =>
  steps.map((s) => (s.id === id && !s.required ? { ...s, enabled: !s.enabled } : s));

export const renameStep = (steps: DraftStep[], id: string, text: string): DraftStep[] =>
  steps.map((s) => (s.id === id ? { ...s, text } : s));

/** Dá para aprovar: algum passo marcado e nenhum marcado com o texto vazio. */
export const canApprove = (steps: DraftStep[]) => steps.some((s) => s.enabled) && steps.every((s) => !s.enabled || s.text.trim() !== '');

/** A resposta de aprovar: os passos marcados na ordem final, os tirados e se algo mudou. */
export function approvePlan(p: PlanProposal, steps: DraftStep[]): UiAnswer {
  const kept = steps.filter((s) => s.enabled).map((s) => ({ id: s.id, text: s.text.trim() }));
  const removed = steps.filter((s) => !s.enabled).map((s) => s.id);
  const original = p.steps.map((s) => ({ id: s.id, text: s.text.trim() }));
  // tirar um passo também muda a lista dos mantidos
  const edited = JSON.stringify(kept) !== JSON.stringify(original);
  return { action: 'accept', values: { steps: kept, removed, edited } };
}

export function planResult(part: UiPart): PlanResult | undefined {
  const r = part.result;
  if (!isObject(r) || !Array.isArray(r.steps)) return undefined;
  const steps = r.steps.filter((s): s is { id: string; text: string } => isObject(s) && typeof s.text === 'string');
  const removed = Array.isArray(r.removed) ? r.removed.filter((s): s is string => typeof s === 'string') : [];
  return { steps, removed, edited: r.edited === true };
}

export function isPlanProposal(v: unknown): v is PlanProposal {
  if (!isObject(v) || !Array.isArray(v.steps) || v.steps.length === 0) return false;
  return v.steps.every((s) => isObject(s) && typeof s.id === 'string' && typeof s.text === 'string');
}
