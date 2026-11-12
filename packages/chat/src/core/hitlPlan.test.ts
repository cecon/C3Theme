import { describe, expect, it } from 'vitest';

import {
  approvePlan,
  canApprove,
  isPlanProposal,
  moveStep,
  planAllows,
  planDraft,
  planResult,
  renameStep,
  toggleStep,
  type PlanProposal
} from './hitlPlan';

const plan: PlanProposal = {
  title: 'Fechar o mês',
  steps: [
    { id: 'a', text: 'Ler as faturas' },
    { id: 'b', text: 'Cobrar as vencidas' },
    { id: 'c', text: 'Gravar o fechamento', required: true }
  ]
};

describe('planAllows', () => {
  it('tudo por padrão, e desliga cada um', () => {
    expect(planAllows(plan)).toEqual({ edit: true, reorder: true, remove: true });
    expect(planAllows({ ...plan, allow: { edit: false, reorder: false, remove: false } })).toEqual({
      edit: false,
      reorder: false,
      remove: false
    });
  });
});

describe('rascunho', () => {
  it('começa com tudo marcado', () => {
    expect(planDraft(plan).every((s) => s.enabled)).toBe(true);
  });
  it('move dentro dos limites', () => {
    const d = planDraft(plan);
    expect(moveStep(d, 0, 2).map((s) => s.id)).toEqual(['b', 'c', 'a']);
    expect(moveStep(d, 2, 0).map((s) => s.id)).toEqual(['c', 'a', 'b']);
    expect(moveStep(d, 1, 1)).toBe(d);
    expect(moveStep(d, -1, 0)).toBe(d);
    expect(moveStep(d, 0, -1)).toBe(d);
    expect(moveStep(d, 3, 0)).toBe(d);
    expect(moveStep(d, 0, 3)).toBe(d);
  });
  it('desmarca, mas não o obrigatório', () => {
    const d = toggleStep(toggleStep(planDraft(plan), 'a'), 'c');
    expect(d.map((s) => s.enabled)).toEqual([false, true, true]);
    expect(toggleStep(d, 'a')[0].enabled).toBe(true);
  });
  it('renomeia só o passo pedido', () => {
    expect(renameStep(planDraft(plan), 'b', 'Cobrar').map((s) => s.text)).toEqual(['Ler as faturas', 'Cobrar', 'Gravar o fechamento']);
  });
  it('aprova com algum marcado e nenhum marcado vazio', () => {
    const d = planDraft(plan);
    expect(canApprove(d)).toBe(true);
    expect(canApprove(renameStep(d, 'a', ' '))).toBe(false);
    expect(canApprove(toggleStep(renameStep(d, 'a', ' '), 'a'))).toBe(true);
    expect(canApprove(d.map((s) => ({ ...s, enabled: false })))).toBe(false);
  });
});

describe('approvePlan', () => {
  it('sem mudança, edited falso', () => {
    expect(approvePlan(plan, planDraft(plan))).toEqual({
      action: 'accept',
      values: { steps: plan.steps.map(({ id, text }) => ({ id, text })), removed: [], edited: false }
    });
  });
  it('tirou, reordenou ou reescreveu', () => {
    const removed = approvePlan(plan, toggleStep(planDraft(plan), 'b')).values!;
    expect(removed).toMatchObject({ removed: ['b'], edited: true });
    expect((removed.steps as unknown[]).length).toBe(2);
    expect(approvePlan(plan, moveStep(planDraft(plan), 0, 1)).values!.edited).toBe(true);
    expect(approvePlan(plan, renameStep(planDraft(plan), 'a', ' Ler tudo ')).values!.steps).toContainEqual({
      id: 'a',
      text: 'Ler tudo'
    });
  });
});

describe('planResult', () => {
  const part = (result: unknown) => ({ id: 'p', kind: 'c3.plan', payload: plan, result });
  it('lê e limpa', () => {
    expect(planResult(part({ steps: [{ id: 'a', text: 'x' }, { id: 'b' }], removed: ['c', 1], edited: true }))).toEqual({
      steps: [{ id: 'a', text: 'x' }],
      removed: ['c'],
      edited: true
    });
    expect(planResult(part({ steps: [] }))).toEqual({ steps: [], removed: [], edited: false });
  });
  it('sem resultado válido', () => {
    expect(planResult(part(undefined))).toBeUndefined();
    expect(planResult(part({ steps: 'x' }))).toBeUndefined();
    expect(planResult(part([]))).toBeUndefined();
  });
});

describe('isPlanProposal', () => {
  it('confere o formato', () => {
    expect(isPlanProposal(plan)).toBe(true);
    expect(isPlanProposal({ steps: [] })).toBe(false);
    expect(isPlanProposal({ steps: [{ id: 'a' }] })).toBe(false);
    expect(isPlanProposal({ steps: [{ text: 'a' }] })).toBe(false);
    expect(isPlanProposal({ steps: 'a' })).toBe(false);
    expect(isPlanProposal(null)).toBe(false);
  });
});
