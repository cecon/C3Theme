// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Message } from '../core/types';
import UiParts, { type UiPartProps } from './UiParts';

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

const message: Message = {
  id: 'a1',
  conversationId: 'c1',
  author: { id: 'bot', name: 'Assistente' },
  direction: 'in',
  createdAt: '2026-11-03T12:00:00Z',
  ui: [
    { id: 'p1', kind: 'demo', payload: { label: 'Confirmar' } },
    { id: 'p2', kind: 'toString', payload: {} }
  ]
};

function Demo({ part, open, onAnswer }: UiPartProps) {
  return (
    <button disabled={!open} onClick={() => void onAnswer?.({ action: 'accept', values: { ok: true } })}>
      {(part.payload as { label: string }).label}
    </button>
  );
}

describe('UiParts', () => {
  it('desenha pelo catálogo e responde com o id da parte', () => {
    const onAnswer = vi.fn().mockResolvedValue(true);
    wrap(<UiParts message={message} renderers={{ demo: Demo }} onAnswer={onAnswer} />);
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    expect(onAnswer).toHaveBeenCalledWith(message, 'p1', { action: 'accept', values: { ok: true } });
  });

  it('kind fora do catálogo vira aviso (nem nome herdado de objeto passa)', () => {
    wrap(<UiParts message={message} renderers={{ demo: Demo }} />);
    expect(screen.getByText('Esta resposta traz um conteúdo que esta tela não sabe mostrar.')).toBeTruthy();
    expect(screen.getAllByRole('group', { name: 'Pedido pelo assistente' })).toHaveLength(2);
  });

  it('parte vencida fica fechada e avisa', () => {
    const expired: Message = {
      ...message,
      ui: [{ id: 'p1', kind: 'demo', payload: { label: 'Confirmar' }, expiresAt: '2020-01-01T00:00:00Z' }]
    };
    wrap(<UiParts message={expired} renderers={{ demo: Demo }} />);
    expect((screen.getByRole('button', { name: 'Confirmar' }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(/expirou/)).toBeTruthy();
  });

  it('parte substituída ou cancelada pelo assistente diz o motivo e não aceita resposta', () => {
    const closed: Message = {
      ...message,
      ui: [
        { id: 'p1', kind: 'demo', payload: { label: 'Velha' }, state: 'cancelled', reason: 'superseded' },
        { id: 'p2', kind: 'demo', payload: { label: 'Desistiu' }, state: 'cancelled', reason: 'agent' }
      ]
    };
    wrap(<UiParts message={closed} renderers={{ demo: Demo }} />);
    expect(screen.getByText('Pedido pelo assistente · substituída')).toBeTruthy();
    expect(screen.getByText('Pedido pelo assistente · cancelada pelo assistente')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Velha' }) as HTMLButtonElement).disabled).toBe(true);
  });
});
