import { describe, expect, it } from 'vitest';

import { answerLabels, isAnswerReady, isPending, primaryOption, type AgentQuestion } from './question';

const q: AgentQuestion = {
  id: 'q1',
  prompt: 'Removo o rótulo?',
  options: [
    { id: 'sim', label: 'Sim, remover', primary: true },
    { id: 'nao', label: 'Deixar como está' }
  ]
};

describe('pergunta do agente', () => {
  it('opção principal', () => {
    expect(primaryOption(q)?.id).toBe('sim');
    expect(primaryOption({ ...q, options: [{ id: 'a', label: 'A' }] })).toBeUndefined();
  });

  it('resposta pronta só com conteúdo', () => {
    expect(isAnswerReady({})).toBe(false);
    expect(isAnswerReady({ text: '  ' })).toBe(false);
    expect(isAnswerReady({ optionIds: ['sim'] })).toBe(true);
    expect(isAnswerReady({ dismissed: true })).toBe(true);
  });

  it('rótulos do que foi respondido, com texto livre no fim', () => {
    expect(answerLabels(q, { optionIds: ['nao'], text: ' depois vejo ' })).toEqual(['Deixar como está', 'depois vejo']);
  });

  it('pendente até ter resposta', () => {
    expect(isPending(q)).toBe(true);
    expect(isPending({ ...q, answer: { dismissed: true } })).toBe(false);
    expect(isPending(undefined)).toBe(false);
  });
});
