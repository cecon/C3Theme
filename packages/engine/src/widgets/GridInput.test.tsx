// @vitest-environment jsdom
// Grade grande do input da ação: Enter anda entre linhas como numa planilha e nunca envia o diálogo; a busca acha a linha.
import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useEffect } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { C3Client } from '../api';
import { EngineProvider } from '../context';
import useActionInput from '../hooks/useActionInput';
import useGridFullScreen from '../hooks/useGridFullScreen';
import type { ActionDef, WireRecord } from '../types';
import GridInput from './GridInput';

afterEach(cleanup);

const action = {
  name: 'contar',
  label: 'Contar',
  input: {
    fields: [
      {
        name: 'itens',
        type: 'grid',
        label: 'Itens',
        fields: [
          { name: 'produto', type: 'string', label: 'Produto', readOnly: true },
          { name: 'qtd', type: 'integer', label: 'Quantidade' }
        ]
      }
    ]
  }
} as unknown as ActionDef;

const NAMES = ['Arroz', 'Feijão', 'Açúcar', 'Café', 'Sal', 'Óleo', 'Farinha', 'Leite', 'Pão', 'Manteiga', 'Queijo', 'Ovos'];
const prefill = (n: number): WireRecord => ({ itens: NAMES.slice(0, n).map((produto) => ({ produto, qtd: 0 })) });

function Harness({ onSubmit }: { onSubmit: () => void }) {
  const form = useActionInput(action);
  useEffect(() => form.reset(action, prefill(12)), []); // eslint-disable-line react-hooks/exhaustive-deps
  const grid = form.grids[0];
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      {grid && <GridInput grid={grid} form={form} error={() => undefined} />}
      <button type="submit">Confirmar</button>
    </form>
  );
}

function setup() {
  const onSubmit = vi.fn();
  const value = { client: {} as C3Client, app: { name: 'demo' } as never, entities: {}, components: {} };
  render(
    <ThemeProvider theme={createTheme()}>
      <IntlProvider locale="pt-BR" onError={() => {}}>
        <EngineProvider value={value}>
          <Harness onSubmit={onSubmit} />
        </EngineProvider>
      </IntlProvider>
    </ThemeProvider>
  );
  const cell = (row: number) => document.querySelector<HTMLInputElement>(`[data-cell="${row}:qtd"] input`)!;
  return { onSubmit, cell };
}

describe('GridInput', () => {
  it('Enter desce e Shift+Enter sobe na mesma coluna, sem enviar o formulário', () => {
    const { onSubmit, cell } = setup();
    cell(0).focus();
    fireEvent.keyDown(cell(0), { key: 'Enter' });
    expect(document.activeElement).toBe(cell(1));
    fireEvent.keyDown(cell(1), { key: 'Enter', shiftKey: true });
    expect(document.activeElement).toBe(cell(0));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('busca sem acento esconde as outras linhas e Enter leva à primeira achada', () => {
    const { onSubmit, cell } = setup();
    const search = screen.getByLabelText('Buscar em Itens');
    fireEvent.change(search, { target: { value: 'acucar' } });
    expect(screen.getByText('1 de', { exact: false })).toBeTruthy();
    expect(screen.queryByText('Arroz')).toBeNull();
    fireEvent.keyDown(search, { key: 'Enter' });
    expect(document.activeElement).toBe(cell(2));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('useGridFullScreen', () => {
  function hook() {
    return renderHook(
      ({ open }: { open: ActionDef | null }) => {
        const form = useActionInput(open);
        return { form, size: useGridFullScreen(form, open) };
      },
      { initialProps: { open: null as ActionDef | null } }
    );
  }

  it('abre em tela cheia quando o prefill traz mais de 15 linhas, decidido junto com a abertura', () => {
    const { result, rerender } = hook();
    // como em RecordActions.start: o prefill já chegou; reset e abertura no mesmo tick
    act(() => result.current.form.reset(action, { itens: Array.from({ length: 16 }, (_, i) => ({ produto: `P${i}`, qtd: 0 })) }));
    rerender({ open: action });
    expect(result.current.size.fullScreen).toBe(true);
    act(() => result.current.size.onToggleFullScreen!());
    expect(result.current.size.fullScreen).toBe(false);
  });

  it('grade pequena abre no tamanho normal', () => {
    const { result, rerender } = hook();
    act(() => result.current.form.reset(action, prefill(3)));
    rerender({ open: action });
    expect(result.current.size.fullScreen).toBe(false);
    expect(result.current.size.maxWidth).toBe('md');
  });
});
