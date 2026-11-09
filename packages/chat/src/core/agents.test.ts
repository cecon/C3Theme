import { describe, expect, it } from 'vitest';

import { isBusy, needsAttention, pendingCount, progressPercent, sortRequests, type AgentRequest } from './agents';

const base = { agentId: 'a', agentName: 'Atendente', text: '...' };
const requests: AgentRequest[] = [
  { ...base, id: 'p', kind: 'progress', progress: 0.4 },
  { ...base, id: 'f', kind: 'failure' },
  { ...base, id: 'q', kind: 'question' },
  { ...base, id: 'a1', kind: 'approval' },
  { ...base, id: 'a2', kind: 'approval' }
];

describe('agentes', () => {
  it('trabalho em andamento não conta como pendente', () => {
    expect(pendingCount(requests)).toBe(4);
    expect(pendingCount([])).toBe(0);
  });

  it('a pilha começa pelo que trava o agente e mantém a ordem de chegada no mesmo tipo', () => {
    expect(sortRequests(requests).map((r) => r.id)).toEqual(['a1', 'a2', 'q', 'f', 'p']);
    expect(requests[0].id).toBe('p');
  });

  it('progresso vira 0–100, preso nas pontas; sem número, barra indeterminada', () => {
    expect(progressPercent(0.426)).toBe(43);
    expect(progressPercent(2)).toBe(100);
    expect(progressPercent(-1)).toBe(0);
    expect(progressPercent(undefined)).toBeUndefined();
    expect(progressPercent(Number.NaN)).toBeUndefined();
  });

  it('só pensando, falando e trabalhando têm movimento; esperando e erro pedem atenção', () => {
    expect(['thinking', 'talking', 'working'].every((s) => isBusy(s as never))).toBe(true);
    expect(isBusy('waiting')).toBe(false);
    expect(needsAttention('waiting') && needsAttention('error')).toBe(true);
    expect(needsAttention('done')).toBe(false);
  });
});
