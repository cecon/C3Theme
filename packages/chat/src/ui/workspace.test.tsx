// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import type { Message } from '../core/types';
import AgentWorkspace from './AgentWorkspace';

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

const reply = (extra: Partial<Message> = {}): Message => ({
  id: 'r1',
  conversationId: 'c1',
  author: { id: 'ia', name: 'Assistente' },
  direction: 'in',
  createdAt: '2026-11-02T12:00:00.000Z',
  ...extra
});

describe('AgentWorkspace', () => {
  it('sem resposta: aviso de vazio', () => {
    wrap(<AgentWorkspace />);
    expect(screen.getByText(/aparece aqui/)).toBeTruthy();
  });

  it('trabalhando: pergunta, situação e etapas abertas', () => {
    wrap(
      <AgentWorkspace
        question="Quantos produtos?"
        message={reply({ streaming: true, reasoning: 'Vou ver.', tools: [{ id: 't', name: 'erp', status: 'running' }] })}
      />
    );
    expect(screen.getByText('Quantos produtos?')).toBeTruthy();
    expect(screen.getByText('Trabalhando…')).toBeTruthy();
    expect(screen.getByLabelText('Raciocínio').textContent).toBe('Vou ver.');
    expect(screen.getByText('erp')).toBeTruthy();
  });

  it('trabalho feito e resposta chegando: "Respondendo…"', () => {
    wrap(<AgentWorkspace message={reply({ streaming: true, text: 'Hoje', reasoning: 'ok' })} />);
    expect(screen.getByText('Respondendo…')).toBeTruthy();
  });

  it('pronta: "Concluído"', () => {
    wrap(<AgentWorkspace message={reply({ text: 'ok', tools: [{ id: 't', name: 'erp', status: 'done', durationMs: 1200 }] })} />);
    expect(screen.getByText('Concluído')).toBeTruthy();
    expect(screen.getByText('1 s')).toBeTruthy();
  });
});
