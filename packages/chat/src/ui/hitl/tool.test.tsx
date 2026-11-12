// @vitest-environment jsdom
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ToolProposal } from '../../core/hitl';
import ToolPart from './ToolPart';
import { answering, message, partOf, wrap } from './hitl.test-utils';

afterEach(cleanup);

const proposal: ToolProposal = {
  tool: { name: 'enviar_email', label: 'Enviar e-mail', description: 'Manda a cobrança ao cliente.' },
  args: { para: 'ana@x.com', copias: 1, urgente: false }
};

const show = (p: unknown, onAnswer = answering(), extra = {}) => {
  wrap(<ToolPart part={partOf('c3.tool', p, extra)} message={message} open onAnswer={onAnswer} {...extra} />);
  return onAnswer;
};

describe('ToolPart', () => {
  it('mostra o pedido e aprova como está', async () => {
    const onAnswer = show(proposal);
    expect(screen.getByText('O assistente quer usar Enviar e-mail')).toBeTruthy();
    expect(screen.getByText('Manda a cobrança ao cliente.')).toBeTruthy();
    expect(screen.getByText('ana@x.com')).toBeTruthy();
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Aprovar' })));
    expect(onAnswer).toHaveBeenCalledWith({ action: 'accept', values: { args: proposal.args, edited: [] } });
  });

  it('edita e aprova com as mudanças', async () => {
    const onAnswer = show(proposal);
    fireEvent.click(screen.getByRole('button', { name: 'Editar argumentos' }));
    fireEvent.change(screen.getByLabelText('copias'), { target: { value: '3' } });
    fireEvent.click(screen.getByLabelText('urgente'));
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Aprovar com as mudanças' })));
    expect(onAnswer).toHaveBeenCalledWith({
      action: 'accept',
      values: { args: { para: 'ana@x.com', copias: 3, urgente: true }, edited: ['copias', 'urgente'] }
    });
  });

  it('edita opção e JSON; só leitura não muda', async () => {
    const onAnswer = show({
      tool: { name: 'reajustar' },
      args: { id: '7', modo: 'a', itens: [1] },
      fields: [
        { name: 'id', type: 'string', readOnly: true },
        { name: 'modo', label: 'Modo', type: 'enum', options: [{ value: 'a', label: 'Aumentar' }, { value: 'b' }] },
        { name: 'itens', type: 'json' }
      ]
    });
    expect(screen.getByText('[1]')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Editar argumentos' }));
    expect((screen.getByLabelText('id') as HTMLInputElement).disabled).toBe(true);
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Modo' }));
    fireEvent.click(screen.getByRole('option', { name: 'b' }));
    fireEvent.change(screen.getByLabelText('itens'), { target: { value: '[1, 2]' } });
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Aprovar com as mudanças' })));
    expect(onAnswer).toHaveBeenCalledWith({
      action: 'accept',
      values: { args: { id: '7', modo: 'b', itens: [1, 2] }, edited: ['modo', 'itens'] }
    });
  });

  it('não aprova com argumento inválido', () => {
    const onAnswer = show({ ...proposal, fields: [{ name: 'copias', type: 'number', required: true }] });
    fireEvent.click(screen.getByRole('button', { name: 'Editar argumentos' }));
    fireEvent.change(screen.getByLabelText(/copias/), { target: { value: 'x' } });
    expect(screen.getByText('Número inválido')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Aprovar' }) as HTMLButtonElement).disabled).toBe(true);
    expect(onAnswer).not.toHaveBeenCalled();
  });

  it('recusa com o motivo', async () => {
    const onAnswer = show(proposal);
    fireEvent.click(screen.getByRole('button', { name: 'Recusar' }));
    fireEvent.change(screen.getByLabelText('Diga ao assistente o porquê (opcional)'), { target: { value: 'cliente já pagou' } });
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Recusar e avisar' })));
    expect(onAnswer).toHaveBeenCalledWith({ action: 'decline', values: { reason: 'cliente já pagou' } });
  });

  it('voltar da recusa não responde; Esc também volta', () => {
    const onAnswer = show(proposal);
    fireEvent.click(screen.getByRole('button', { name: 'Recusar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Recusar' }));
    fireEvent.keyDown(screen.getByLabelText('Diga ao assistente o porquê (opcional)'), { key: 'Escape' });
    expect(screen.getByRole('button', { name: 'Aprovar' })).toBeTruthy();
    expect(onAnswer).not.toHaveBeenCalled();
  });

  it('sem responder, recusa direto', async () => {
    const onAnswer = show({ ...proposal, allow: { respond: false, edit: false } });
    expect(screen.queryByRole('button', { name: 'Editar argumentos' })).toBeNull();
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Recusar' })));
    expect(onAnswer).toHaveBeenCalledWith({ action: 'decline' });
  });

  it('risco alto pede o segundo clique e não oferece sempre permitir', async () => {
    const onAnswer = show({ ...proposal, risk: 'high', allow: { always: true } });
    expect(screen.getByText('Risco alto')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Sempre permitir' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Aprovar' }));
    expect(onAnswer).not.toHaveBeenCalled();
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Confirmar Enviar e-mail' })));
    expect(onAnswer).toHaveBeenCalledTimes(1);
  });

  it('sempre permitir quando oferecido; risco médio avisa', async () => {
    const onAnswer = show({ ...proposal, risk: 'medium', allow: { always: true } });
    expect(screen.getByText('Atenção')).toBeTruthy();
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Sempre permitir' })));
    expect(onAnswer).toHaveBeenCalledWith({ action: 'accept', values: { args: proposal.args, edited: [], always: true } });
  });

  it('sem onAnswer, só mostra', () => {
    wrap(<ToolPart part={partOf('c3.tool', proposal)} message={message} open />);
    expect((screen.getByRole('button', { name: 'Aprovar' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('trava os botões enquanto o servidor responde', async () => {
    let finish: (v: boolean) => void = () => {};
    const onAnswer = vi.fn(() => new Promise<boolean>((r) => (finish = r)));
    show(proposal, onAnswer);
    fireEvent.click(screen.getByRole('button', { name: 'Aprovar' }));
    expect((screen.getByRole('button', { name: 'Aprovar' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Aprovar' }));
    await act(async () => finish(true));
    expect(onAnswer).toHaveBeenCalledTimes(1);
    expect((screen.getByRole('button', { name: 'Aprovar' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('formato errado vira aviso', () => {
    show({ tool: {} });
    expect(screen.getByText('O assistente mandou um pedido que não dá para mostrar.')).toBeTruthy();
  });
});

describe('ToolPart fechada', () => {
  const closed = (extra: object) => wrap(<ToolPart part={partOf('c3.tool', proposal, extra)} message={message} open={false} />);

  it('aprovada, com mudanças ou sempre', () => {
    closed({ state: 'submitted', result: { args: {}, edited: [] } });
    expect(screen.getByText('Aprovado')).toBeTruthy();
    cleanup();
    closed({ state: 'submitted', result: { args: {}, edited: ['a', 'b'] } });
    expect(screen.getByText('Aprovado com 2 mudanças')).toBeTruthy();
    cleanup();
    closed({ state: 'submitted', result: { args: {}, edited: [], always: true } });
    expect(screen.getByText('Sempre permitido')).toBeTruthy();
  });

  it('recusada com o motivo, ou fechada sem resposta', () => {
    closed({ state: 'declined', result: { reason: 'não' } });
    expect(screen.getByText('Recusado')).toBeTruthy();
    expect(screen.getByText('Motivo: não')).toBeTruthy();
    cleanup();
    closed({ state: 'cancelled' });
    expect(screen.getByText('Enviar e-mail')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('em inglês', () => {
    wrap(<ToolPart part={partOf('c3.tool', proposal, { state: 'submitted', result: {} })} message={message} open={false} />, 'en');
    expect(screen.getByText('Approved')).toBeTruthy();
  });
});
