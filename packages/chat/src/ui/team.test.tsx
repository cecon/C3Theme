// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AgentQuestion } from '../core/question';
import { APPROVAL } from '../core/team';
import type { Author } from '../core/types';
import QuestionCard from './QuestionCard';
import HandoffMarker from './team/HandoffMarker';
import TaskOwner from './team/TaskOwner';

afterEach(cleanup);

const theme = createTheme({ cssVariables: true });
const wrap = (ui: ReactNode) =>
  render(
    <ThemeProvider theme={theme}>
      <IntlProvider locale="pt-BR" onError={() => {}}>
        {ui}
      </IntlProvider>
    </ThemeProvider>
  );

const ATENDENTE: Author = { id: 'at', name: 'Atendente', kind: 'agent' };
const COZINHA: Author = { id: 'co', name: 'Cozinha', kind: 'agent' };
const approval: AgentQuestion = {
  id: 'a1',
  prompt: '',
  kind: 'approval',
  tool: { name: 'estoque_baixar', label: 'Baixar estoque', input: '{ "item": "lasanha", "qtd": 2 }' }
};

describe('aprovação de ferramenta', () => {
  it('título com o agente e a ferramenta; três respostas', () => {
    const onAnswer = vi.fn();
    wrap(<QuestionCard question={approval} agentName="Cozinha" onAnswer={onAnswer} />);
    expect(screen.getByText('Cozinha quer usar Baixar estoque')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Sempre permitir/ }));
    expect(onAnswer).toHaveBeenLastCalledWith({ optionIds: [APPROVAL.always] });
    fireEvent.click(screen.getByRole('button', { name: 'Recusar' }));
    expect(onAnswer).toHaveBeenLastCalledWith({ optionIds: [APPROVAL.decline] });
  });

  it('Ctrl+Enter permite uma vez; não tem X nem Esc', () => {
    const onAnswer = vi.fn();
    wrap(<QuestionCard question={approval} agentName="Cozinha" onAnswer={onAnswer} active />);
    expect(screen.queryByRole('button', { name: 'Dispensar' })).toBeNull();
    fireEvent.keyDown(screen.getByRole('group'), { key: 'Escape' });
    expect(onAnswer).not.toHaveBeenCalled();
    fireEvent.keyDown(window, { key: 'Enter', ctrlKey: true });
    expect(onAnswer).toHaveBeenCalledWith({ optionIds: [APPROVAL.once] });
  });

  it('argumentos recolhidos até pedir', () => {
    wrap(<QuestionCard question={approval} onAnswer={vi.fn()} />);
    expect(screen.queryByText(/lasanha/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Ver argumentos' }));
    expect(screen.getByText(/lasanha/)).toBeTruthy();
  });

  it('respondida, mostra o que foi escolhido', () => {
    wrap(<QuestionCard question={{ ...approval, answer: { optionIds: [APPROVAL.decline] } }} />);
    expect(screen.getByText('Recusado')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Permitir/ })).toBeNull();
  });
});

describe('passagem e dono', () => {
  it('marcador diz quem passou para quem e abre a tarefa', () => {
    const onOpen = vi.fn();
    const handoff = { from: ATENDENTE, to: COZINHA, task: 'confirmar 2 lasanhas', taskId: 't1' };
    wrap(<HandoffMarker handoff={handoff} onOpen={onOpen} />);
    fireEvent.click(screen.getByRole('button', { name: 'Atendente passou para Cozinha: confirmar 2 lasanhas' }));
    expect(onOpen).toHaveBeenCalledWith(handoff);
  });

  it('marcador sem taskId não é botão', () => {
    wrap(<HandoffMarker handoff={{ from: ATENDENTE, to: COZINHA, task: 'x' }} onOpen={vi.fn()} />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('dono mostra as ações; Parar só com o agente em movimento', () => {
    const onStop = vi.fn();
    const { rerender } = wrap(<TaskOwner owner={COZINHA} state="working" onReassign={vi.fn()} onStop={onStop} onArchive={vi.fn()} />);
    expect(screen.getByRole('region', { name: 'Responsável pela tarefa: Cozinha' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Parar' }));
    expect(onStop).toHaveBeenCalled();
    rerender(
      <ThemeProvider theme={theme}>
        <IntlProvider locale="pt-BR" onError={() => {}}>
          <TaskOwner owner={COZINHA} state="done" onStop={onStop} onArchive={vi.fn()} />
        </IntlProvider>
      </ThemeProvider>
    );
    expect(screen.queryByRole('button', { name: 'Parar' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Arquivar' })).toBeTruthy();
  });
});
