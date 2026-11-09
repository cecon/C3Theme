// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AgentQuestion } from '../core/question';
import QuestionCard from './QuestionCard';

afterEach(cleanup);

const theme = createTheme({ cssVariables: true });
// sem as mensagens carregadas, o react-intl reclama de cada chave (e o erro serializado estoura a memória do vitest)
const wrap = (ui: ReactNode) =>
  render(
    <ThemeProvider theme={theme}>
      <IntlProvider locale="pt-BR" onError={() => {}}>
        {ui}
      </IntlProvider>
    </ThemeProvider>
  );

const single: AgentQuestion = {
  id: 'q1',
  prompt: 'Removo o rótulo Low do repositório?',
  options: [
    { id: 'sim', label: 'Sim, remover', primary: true },
    { id: 'nao', label: 'Deixar como está' }
  ]
};

describe('QuestionCard', () => {
  it('clicar numa opção responde com ela', () => {
    const onAnswer = vi.fn();
    wrap(<QuestionCard question={single} onAnswer={onAnswer} />);
    fireEvent.click(screen.getByRole('button', { name: 'Deixar como está' }));
    expect(onAnswer).toHaveBeenCalledWith({ optionIds: ['nao'] });
  });

  it('Ctrl+Enter de fora do card escolhe a principal quando é a pergunta em aberto', () => {
    const onAnswer = vi.fn();
    wrap(<QuestionCard question={single} onAnswer={onAnswer} active />);
    fireEvent.keyDown(window, { key: 'Enter', ctrlKey: true });
    expect(onAnswer).toHaveBeenCalledWith({ optionIds: ['sim'] });
  });

  it('Ctrl+Enter na caixa de mensagem: vazia responde, com texto escrito não', () => {
    const onAnswer = vi.fn();
    wrap(
      <>
        <textarea aria-label="Mensagem" />
        <QuestionCard question={single} onAnswer={onAnswer} active />
      </>
    );
    const box = screen.getByLabelText('Mensagem') as HTMLTextAreaElement;
    box.value = 'outra coisa';
    fireEvent.keyDown(box, { key: 'Enter', ctrlKey: true });
    expect(onAnswer).not.toHaveBeenCalled();
    box.value = '';
    fireEvent.keyDown(box, { key: 'Enter', ctrlKey: true });
    expect(onAnswer).toHaveBeenCalledWith({ optionIds: ['sim'] });
  });

  it('X dispensa', () => {
    const onAnswer = vi.fn();
    wrap(<QuestionCard question={single} onAnswer={onAnswer} />);
    fireEvent.click(screen.getByLabelText('Dispensar pergunta'));
    expect(onAnswer).toHaveBeenCalledWith({ dismissed: true });
  });

  it('escolha múltipla: marca e responde', () => {
    const onAnswer = vi.fn();
    const q: AgentQuestion = {
      ...single,
      kind: 'multiple',
      options: [
        { id: 'a', label: 'Vendas' },
        { id: 'b', label: 'Estoque' }
      ]
    };
    wrap(<QuestionCard question={q} onAnswer={onAnswer} />);
    const reply = screen.getByRole('button', { name: /Responder/ });
    expect((reply as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByLabelText('Vendas'));
    fireEvent.click(screen.getByLabelText('Estoque'));
    fireEvent.click(reply);
    expect(onAnswer).toHaveBeenCalledWith({ optionIds: ['a', 'b'] });
  });

  it('resposta livre', () => {
    const onAnswer = vi.fn();
    wrap(<QuestionCard question={{ id: 'q', prompt: 'Qual o motivo?', kind: 'text' }} onAnswer={onAnswer} />);
    fireEvent.change(screen.getByLabelText('Sua resposta'), { target: { value: ' produto vencido ' } });
    fireEvent.click(screen.getByRole('button', { name: /Responder/ }));
    expect(onAnswer).toHaveBeenCalledWith({ text: 'produto vencido' });
  });

  it('respondida: mostra o escolhido e some com os botões', () => {
    wrap(<QuestionCard question={{ ...single, answer: { optionIds: ['sim'] } }} onAnswer={() => {}} />);
    expect(screen.getByText('Sim, remover')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Deixar/ })).toBeNull();
    expect(screen.queryByLabelText('Dispensar pergunta')).toBeNull();
  });

  it('sem onAnswer, os botões ficam desabilitados', () => {
    wrap(<QuestionCard question={single} />);
    expect((screen.getByRole('button', { name: /Sim, remover/ }) as HTMLButtonElement).disabled).toBe(true);
  });
});
