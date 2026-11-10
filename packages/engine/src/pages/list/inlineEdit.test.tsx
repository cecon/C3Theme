// @vitest-environment jsdom
// Coluna editável da lista (#29): instant grava ao mudar (texto, ao sair do campo); batch junta e grava no Salvar.
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError, type C3Client } from '../../api';
import { EngineProvider } from '../../context';
import type { EntityDef, FieldDef, WireRecord } from '../../types';
import EditBar from './EditBar';
import { EditCell } from './EditCell';
import useInlineEdit from './useInlineEdit';

afterEach(cleanup);

const fields: FieldDef[] = [
  { name: 'active', type: 'boolean', label: 'Ativo' },
  { name: 'price', type: 'integer', label: 'Preço' },
  { name: 'cost', type: 'integer', label: 'Custo', readOnlyWhen: { field: 'cost', op: 'gt', value: 0 } }
] as FieldDef[];
const def = { name: 'p', label: { singular: 'P', plural: 'Ps' }, fields } as unknown as EntityDef;
const rows: WireRecord[] = [
  { id: '1', active: true, price: 10, cost: 0, _version: 'v1' },
  { id: '2', active: false, price: 20, cost: 5, _version: 'v2' }
];

function Harness({ saved }: { saved: () => void }) {
  const edit = useInlineEdit('p', def, saved);
  return (
    <>
      <EditBar edit={edit} />
      {rows.map((row) =>
        fields.map((f) => (
          <EditCell
            key={`${row.id}${f.name}`}
            entity="p"
            field={f}
            row={row}
            mode={f.name === 'active' ? 'instant' : f.name === 'cost' ? 'instant' : 'batch'}
            edit={edit}
            readView={<span data-testid={`read-${row.id}-${f.name}`}>{String(row[f.name])}</span>}
          />
        ))
      )}
    </>
  );
}

function setup(update: C3Client['update'], canUpdate = true) {
  const saved = vi.fn();
  const value = {
    client: { update } as C3Client,
    app: { name: 'demo' } as never,
    entities: { p: { def, capabilities: { update: canUpdate } } } as never,
    components: {}
  };
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <IntlProvider locale="pt-BR" onError={() => {}}>
        <EngineProvider value={value}>
          <Harness saved={saved} />
        </EngineProvider>
      </IntlProvider>
    </ThemeProvider>
  );
  const input = (id: string, f: string) => document.querySelector<HTMLInputElement>(`[data-edit-cell="${id}:${f}"] input`)!;
  return { saved, input };
}

describe('coluna editável da lista', () => {
  it('instant: o switch grava na hora com a _version; o número grava ao sair; o travado só mostra', async () => {
    const update = vi.fn(async () => ({}));
    const { saved, input } = setup(update);
    await act(async () => fireEvent.click(input('1', 'active')));
    expect(update).toHaveBeenCalledWith('p', '1', { active: false }, { ifMatch: 'v1' });
    expect(saved).toHaveBeenCalledTimes(1);
    fireEvent.change(input('1', 'cost'), { target: { value: '7' } });
    expect(update).toHaveBeenCalledTimes(1);
    await act(async () => fireEvent.blur(input('1', 'cost')));
    expect(update).toHaveBeenLastCalledWith('p', '1', { cost: 7 }, { ifMatch: 'v1' });
    // custo já gravado (readOnlyWhen): sem campo
    expect(screen.getByTestId('read-2-cost')).toBeTruthy();
  });

  it('batch: junta as linhas, Salvar grava uma por linha; a que falha fica pendente com o erro na célula', async () => {
    const update = vi.fn(async (_e: string, id: string) => {
      if (id === '2') throw new ApiError(422, 'validation', 'x', { price: [{ code: 'too_large', message: 'Grande demais.' }] });
      return {};
    });
    const { saved, input } = setup(update);
    fireEvent.change(input('1', 'price'), { target: { value: '11' } });
    fireEvent.change(input('2', 'price'), { target: { value: '999' } });
    expect(screen.getByRole('status').textContent).toContain('2 linhas alteradas');
    await act(async () => fireEvent.click(screen.getByRole('button', { name: /Salvar alterações/ })));
    expect(update.mock.calls.map((c) => c.slice(1, 3))).toEqual([
      ['1', { price: 11 }],
      ['2', { price: 999 }]
    ]);
    expect(saved).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status').textContent).toContain('1 linha alterada');
    expect(document.body.textContent).toContain('Grande demais.');
    fireEvent.click(screen.getByRole('button', { name: 'Descartar' }));
    expect(screen.queryByRole('status')).toBeNull();
    expect(input('2', 'price').value).toBe('20');
  });

  it('erro sem campo (412) aparece na célula; sem permissão de alterar, nada é campo', async () => {
    const update = vi.fn(async () => {
      throw new ApiError(412, 'stale', 'mudou');
    });
    const { input } = setup(update);
    await act(async () => fireEvent.click(input('1', 'active')));
    expect(document.body.textContent).toContain('Este registro mudou');
    cleanup();
    setup(update, false);
    expect(document.querySelector('[data-edit-cell]')).toBeNull();
  });
});
