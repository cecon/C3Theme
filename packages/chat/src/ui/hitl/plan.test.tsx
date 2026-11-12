// @vitest-environment jsdom
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import type { PlanProposal } from '../../core/hitlPlan';
import PlanPart from './PlanPart';
import { answering, message, partOf, wrap } from './hitl.test-utils';

afterEach(cleanup);

const plan: PlanProposal = {
  title: 'Fechar o mês',
  steps: [
    { id: 'a', text: 'Ler as faturas', detail: '120 faturas' },
    { id: 'b', text: 'Cobrar as vencidas' },
    { id: 'c', text: 'Gravar o fechamento', required: true }
  ]
};

const show = (p: unknown = plan, onAnswer = answering()) => {
  wrap(<PlanPart part={partOf('c3.plan', p)} message={message} open onAnswer={onAnswer} />);
  return onAnswer;
};
const boxes = () => screen.getAllByRole('checkbox') as HTMLInputElement[];

describe('PlanPart', () => {
  it('aprova como veio', async () => {
    const onAnswer = show();
    expect(screen.getByRole('heading', { name: 'Fechar o mês' })).toBeTruthy();
    expect(screen.getByText('120 faturas')).toBeTruthy();
    expect(screen.getByText('Obrigatório')).toBeTruthy();
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Aprovar plano' })));
    expect(onAnswer).toHaveBeenCalledWith({
      action: 'accept',
      values: { steps: plan.steps.map(({ id, text }) => ({ id, text })), removed: [], edited: false }
    });
  });

  it('tira, reordena e reescreve', async () => {
    const onAnswer = show();
    fireEvent.click(boxes()[1]);
    expect(boxes()[2].disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Descer o passo 1' }));
    fireEvent.change(screen.getAllByRole('textbox', { name: 'Passo 3' })[0], { target: { value: 'Gravar e avisar' } });
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Aprovar com as mudanças' })));
    expect(onAnswer).toHaveBeenCalledWith({
      action: 'accept',
      values: {
        steps: [
          { id: 'a', text: 'Ler as faturas' },
          { id: 'c', text: 'Gravar e avisar' }
        ],
        removed: ['b'],
        edited: true
      }
    });
  });

  it('setas nos limites ficam desligadas; subir move', () => {
    show();
    expect((screen.getByRole('button', { name: 'Subir o passo 1' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Descer o passo 3' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Subir o passo 2' }));
    expect((screen.getAllByRole('textbox')[0] as HTMLTextAreaElement).value).toBe('Cobrar as vencidas');
  });

  it('não aprova com passo marcado vazio', () => {
    show();
    fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: ' ' } });
    expect((screen.getByRole('button', { name: 'Aprovar com as mudanças' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('sem editar, reordenar nem tirar', () => {
    show({ ...plan, allow: { edit: false, reorder: false, remove: false } });
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByRole('button', { name: /Subir/ })).toBeNull();
    expect(boxes().every((b) => b.disabled)).toBe(true);
    expect(screen.getByText('Ler as faturas')).toBeTruthy();
  });

  it('recusa com o motivo', async () => {
    const onAnswer = show();
    fireEvent.click(screen.getByRole('button', { name: 'Recusar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Recusar' }));
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Recusar e avisar' })));
    expect(onAnswer).toHaveBeenCalledWith({ action: 'decline' });
  });

  it('título padrão e formato errado', () => {
    show({ steps: [{ id: 'a', text: 'x' }] });
    expect(screen.getByRole('heading', { name: 'Plano proposto' })).toBeTruthy();
    cleanup();
    show({ steps: [] });
    expect(screen.getByText('O assistente mandou um pedido que não dá para mostrar.')).toBeTruthy();
  });
});

describe('PlanPart fechada', () => {
  const closed = (extra: object) => wrap(<PlanPart part={partOf('c3.plan', plan, extra)} message={message} open={false} />);

  it('aprovada, com os tirados', () => {
    closed({ state: 'submitted', result: { steps: [{ id: 'a', text: 'x' }], removed: ['b'], edited: true } });
    expect(screen.getByText('Plano aprovado: 1 passo · 1 tirado')).toBeTruthy();
    cleanup();
    closed({
      state: 'submitted',
      result: {
        steps: [
          { id: 'a', text: 'x' },
          { id: 'b', text: 'y' }
        ],
        removed: []
      }
    });
    expect(screen.getByText('Plano aprovado: 2 passos')).toBeTruthy();
  });

  it('recusada ou fechada', () => {
    closed({ state: 'declined', result: { reason: 'agora não' } });
    expect(screen.getByText('Plano recusado')).toBeTruthy();
    expect(screen.getByText('Motivo: agora não')).toBeTruthy();
    cleanup();
    closed({ state: 'expired' });
    expect(screen.getByText('Fechar o mês')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });
});
