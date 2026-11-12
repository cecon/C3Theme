// @vitest-environment jsdom
// Um estado declarado desenhado sozinho (#99): o que a página registrada usa nas próprias buscas.
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { C3ThemeProvider } from '@c3theme/ui';

import { EngineProvider, type EngineState } from '../context';
import StateView from './StateView';
import type { StatesDef } from './states';

afterEach(cleanup);

function Seta() {
  return <svg data-testid="seta" />;
}

const wrap = (node: ReactNode) =>
  render(
    <C3ThemeProvider>
      <EngineProvider value={{ icons: { Seta } } as unknown as EngineState}>
        <MemoryRouter>{node}</MemoryRouter>
      </EngineProvider>
    </C3ThemeProvider>
  );

const states: StatesDef = {
  empty: { text: { id: 'caixa.vazio', defaultMessage: 'Nada no caixa.' }, action: { label: 'Abrir', path: '/abrir', icon: 'Seta' } },
  error: { text: 'Falhou.' },
  offline: { text: 'Sem conexão.' }
};

describe('StateView', () => {
  it('texto por chave de i18n e o ícone da ação pelo catálogo', () => {
    wrap(<StateView states={states} state="empty" dense />);
    expect(screen.getByText('Nada no caixa.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Abrir' }).getAttribute('href')).toBe('/abrir');
    expect(screen.getByTestId('seta')).toBeTruthy();
  });

  it('erro sem onRetry: só a mensagem; com ele, o botão chama', () => {
    const { unmount } = wrap(<StateView states={states} state="error" />);
    expect(screen.getByRole('alert').textContent).toBe('Falhou.');
    expect(screen.queryByRole('button')).toBeNull();
    unmount();
    const onRetry = vi.fn();
    wrap(<StateView states={states} state="error" onRetry={onRetry} />);
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('offline sem keeps: só o recado, sem a lista', () => {
    wrap(<StateView states={states} state="offline" />);
    expect(screen.getByRole('status').textContent).toBe('Sem conexão.');
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('estado não declarado não desenha nada', () => {
    const { container } = wrap(<StateView states={states} state="forbidden" />);
    expect(container.textContent).toBe('');
    cleanup();
    expect(wrap(<StateView states={{}} state="loading" />).container.textContent).toBe('');
  });
});
