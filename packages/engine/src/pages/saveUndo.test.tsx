// @vitest-environment jsdom
// Desfazer depois de Salvar no formulário (#12): volta campos e listas with_parent; 412 avisa e não sobrescreve.
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { MemoryRouter } from 'react-router';
import { SWRConfig } from 'swr';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { notify, type NotifyAction } from '@c3theme/ui';
import { ApiError, type C3Client } from '../api';
import { EngineProvider } from '../context';
import type { Capabilities, EntityDef } from '../types';
import { STALE_UNDO } from '../undo';
import { restoreBody } from '../hooks/useSaveUndo';
import EntityForm from './EntityForm';

vi.mock('@c3theme/ui', async (orig) => ({ ...(await orig<typeof import('@c3theme/ui')>()), notify: vi.fn() }));

afterEach(() => {
  cleanup();
  vi.mocked(notify).mockClear();
});

const ALL: Capabilities = { list: true, read: true, create: true, update: true, delete: false };
const habilidade: EntityDef = {
  name: 'habilidade',
  label: { singular: 'Habilidade', plural: 'Habilidades' },
  titleField: 'nome',
  fields: [{ name: 'nome', type: 'string', label: 'Nome' }],
  views: { form: { sections: [{ rows: [['nome']] }, { related: { entity: 'membro', field: 'habilidade_id', save: 'with_parent' } }] } }
};
const membro: EntityDef = {
  name: 'membro',
  label: { singular: 'Membro', plural: 'Membros' },
  fields: [
    { name: 'habilidade_id', type: 'string', label: 'Habilidade' },
    { name: 'agente', type: 'string', label: 'Agente' }
  ]
};

const before = {
  id: '7',
  nome: 'Vendas',
  membro: [
    { id: 'a', agente: 'Ana' },
    { id: 'b', agente: 'Bia' }
  ],
  _version: 'v1'
};

function setup(update: C3Client['update'], def: EntityDef = habilidade) {
  const value = {
    client: { get: vi.fn().mockResolvedValue(before), update } as unknown as C3Client,
    app: { name: 'demo' } as never,
    entities: { habilidade: { def, capabilities: ALL }, membro: { def: membro, capabilities: ALL } },
    components: {}
  };
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <IntlProvider locale="pt-BR" onError={() => {}}>
        <SWRConfig value={{ provider: () => new Map() }}>
          <MemoryRouter>
            <EngineProvider value={value}>
              <EntityForm entity="habilidade" id="7" />
            </EngineProvider>
          </MemoryRouter>
        </SWRConfig>
      </IntlProvider>
    </ThemeProvider>
  );
}

async function saveRenamed() {
  fireEvent.click(await screen.findByRole('button', { name: 'Editar' }));
  fireEvent.change(screen.getByLabelText(/Nome/), { target: { value: 'Suporte' } });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
  await waitFor(() => expect(notify).toHaveBeenCalledWith('Salvo.', 'success', expect.anything()));
  return vi.mocked(notify).mock.calls[0][2] as NotifyAction;
}

const after = { id: '7', nome: 'Suporte', membro: [{ id: 'a', agente: 'Ana' }], _version: 'v2' };

describe('Desfazer do Salvar', () => {
  it('manda o registro de antes com a versão de depois e C3-Undo', async () => {
    const update = vi
      .fn()
      .mockResolvedValueOnce(after)
      .mockResolvedValueOnce({ ...before, _version: 'v3' });
    setup(update);
    const action = await saveRenamed();
    expect(action.label).toBe('Desfazer');
    action.onClick();
    await waitFor(() => expect(update).toHaveBeenCalledTimes(2));
    expect(update.mock.calls[1]).toEqual([
      'habilidade',
      '7',
      { nome: 'Vendas', membro: [{ id: 'a', agente: 'Ana' }, { agente: 'Bia' }] },
      { ifMatch: 'v2', undo: true }
    ]);
    await waitFor(() => expect(notify).toHaveBeenLastCalledWith('Desfeito.'));
  });

  it('412 avisa que alguém mudou e não desfaz', async () => {
    const update = vi
      .fn()
      .mockResolvedValueOnce(after)
      .mockRejectedValueOnce(new ApiError(412, 'stale', 'mudou'));
    setup(update);
    (await saveRenamed()).onClick();
    await waitFor(() => expect(notify).toHaveBeenLastCalledWith(STALE_UNDO, 'warning'));
  });

  it('entidade undoable: false ou sem versão não oferece', async () => {
    setup(vi.fn().mockResolvedValue(after), { ...habilidade, undoable: false });
    fireEvent.click(await screen.findByRole('button', { name: 'Editar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    await waitFor(() => expect(notify).toHaveBeenCalledWith('Salvo.', 'success', undefined));
    expect(restoreBody(habilidade, { id: '1', nome: 'X' }, {}, () => membro)).toEqual({ nome: 'X', membro: [] });
  });
});
