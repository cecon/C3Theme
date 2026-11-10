// @vitest-environment jsdom
// Busca do Ctrl K com registros do backend (#24): espera, cancela, agrupa, realça e cai para só telas no erro.
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import CommandSearch from '../CommandSearch';
import { NavContext, type NavGroup } from '../nav';
import { matchRange } from './highlight';
import type { RecordSearch } from './types';

afterEach(cleanup);
beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
afterEach(() => vi.useRealTimers());

const menu: NavGroup[] = [{ id: 'g', items: [{ id: 'p', title: 'Pão de forma', url: '/forma' }] }];

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>;
}

function open(search?: RecordSearch) {
  render(
    <ThemeProvider theme={createTheme()}>
      <IntlProvider locale="pt-BR" onError={() => {}}>
        <MemoryRouter>
          <NavContext.Provider value={menu}>
            <CommandSearch search={search} />
            <Routes>
              <Route path="*" element={<Where />} />
            </Routes>
          </NavContext.Provider>
        </MemoryRouter>
      </IntlProvider>
    </ThemeProvider>
  );
  fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
  return screen.getByRole('textbox');
}

const type = async (input: HTMLElement, value: string) => {
  fireEvent.change(input, { target: { value } });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(250);
  });
};

describe('realce sem acento', () => {
  it('acha "pao" em "Pão francês" e devolve a posição no original', () => {
    expect(matchRange('Pão francês', 'pao')).toEqual([0, 3]);
    expect(matchRange('O pão de queijo', 'PÃO DE')).toEqual([2, 8]);
    expect(matchRange('Bolo', 'pao')).toBeUndefined();
    expect(matchRange('Bolo', '  ')).toBeUndefined();
  });
});

describe('Ctrl K com registros', () => {
  it('sem search, só telas, como antes', async () => {
    const input = open();
    await type(input, 'zz');
    expect(screen.getByText('Nenhuma tela com esse nome.')).toBeTruthy();
  });

  it('espera 2 letras e 200 ms, cancela o pedido anterior e mostra telas e grupos', async () => {
    const calls: { q: string; signal: AbortSignal }[] = [];
    const search: RecordSearch = vi.fn((q, signal) => {
      calls.push({ q, signal });
      return Promise.resolve([
        { group: 'Produtos', title: 'Pão francês', snippet: 'Padaria', path: '/produto/1', at: new Date().toISOString() },
        { group: 'Mensagens', title: 'Ana', snippet: 'tem pão de queijo?', path: '/conversa/7' }
      ]);
    });
    const input = open(search);
    await type(input, 'p');
    expect(search).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: 'pa' } });
    await type(input, 'pao');
    expect(calls.map((c) => c.q)).toEqual(['pao']);
    expect(screen.getByText('Telas')).toBeTruthy();
    expect(screen.getByText('Produtos')).toBeTruthy();
    expect(screen.getByText('Mensagens')).toBeTruthy();
    expect(screen.getByText('agora')).toBeTruthy();
    expect(screen.getAllByText('Pão').map((m) => m.tagName)).toContain('MARK');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByTestId('where').textContent).toBe('/conversa/7');
  });

  it('erro do backend segue com as telas, sem aviso', async () => {
    const input = open(() => Promise.reject(new Error('404')));
    await type(input, 'pao');
    expect(screen.getByRole('button', { name: /Pão de forma/ })).toBeTruthy();
    expect(screen.queryByText('Telas')).toBeNull();
    await type(input, 'xyz');
    expect(screen.getByText('Nada encontrado.')).toBeTruthy();
  });

  it('texto novo antes da resposta cancela o pedido anterior', async () => {
    const signals: AbortSignal[] = [];
    const input = open((_q, signal) => {
      signals.push(signal);
      return new Promise(() => {});
    });
    await type(input, 'pa');
    expect(screen.getByRole('status').textContent).toBe('Buscando…');
    await type(input, 'pao');
    expect(signals).toHaveLength(2);
    expect(signals[0].aborted).toBe(true);
  });
});
