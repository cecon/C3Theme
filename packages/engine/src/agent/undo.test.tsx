// @vitest-environment jsdom
// Desfazer conferido no servidor: a tela manda a versão e, num 412, não sobrescreve nem oferece de novo.
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import type { ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError, type C3Client } from '../api';
import { EngineProvider } from '../context';
import type { Capabilities, EntityDef } from '../types';
import { STALE_UNDO } from '../undo';
import { agentUiRenderers } from '.';

afterEach(cleanup);

const ALL: Capabilities = { list: true, read: true, create: true, update: true, delete: true, actions: { ganhar: true, reabrir: true } };
const negocio: EntityDef = {
  name: 'negocio',
  label: { singular: 'Negócio', plural: 'Negócios' },
  titleField: 'nome',
  fields: [
    { name: 'nome', type: 'string', label: 'Nome' },
    { name: 'valor', type: 'integer', label: 'Valor' }
  ],
  actions: [
    { name: 'ganhar', label: 'Ganhar', inverse: 'reabrir' },
    { name: 'reabrir', label: 'Reabrir' }
  ]
};

function setup(client: Partial<C3Client>, ui: ReactNode, def: EntityDef = negocio) {
  const value = {
    client: client as C3Client,
    app: { name: 'demo' } as never,
    entities: { negocio: { def, capabilities: ALL } },
    components: {}
  };
  return render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <IntlProvider locale="pt-BR" onError={() => {}}>
        <SWRConfig value={{ provider: () => new Map() }}>
          <EngineProvider value={value}>{ui}</EngineProvider>
        </SWRConfig>
      </IntlProvider>
    </ThemeProvider>
  );
}

const part = (kind: string, payload: unknown) => ({ id: 'p1', kind, payload });
const stale = () => new ApiError(412, 'stale', 'mudou');
const draft = { entity: 'negocio', id: '3', values: { valor: 900 } };

describe('Desfazer conferido no servidor', () => {
  it('alteração vai com a versão conferida; Desfazer com a de depois; 412 avisa e some o botão', async () => {
    const get = vi.fn().mockResolvedValue({ id: '3', nome: 'Padaria', valor: 500, _version: 'v0' });
    const update = vi.fn().mockResolvedValueOnce({ id: '3', nome: 'Padaria', valor: 900, _version: 'v1' }).mockRejectedValueOnce(stale());
    const onAnswer = vi.fn().mockResolvedValue(true);
    const Record = agentUiRenderers['c3.record'];
    setup({ get, update }, <Record part={part('c3.record', draft)} open onAnswer={onAnswer} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Gravar alteração' }));
    await waitFor(() => expect(update).toHaveBeenCalledWith('negocio', '3', { valor: 900 }, { ifMatch: 'v0' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Desfazer' }));
    await waitFor(() => expect(update).toHaveBeenLastCalledWith('negocio', '3', { valor: 500 }, { ifMatch: 'v1', undo: true }));
    expect(await screen.findByText(STALE_UNDO)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Desfazer' })).toBeNull();
    expect(onAnswer).not.toHaveBeenCalledWith(expect.objectContaining({ action: 'undo' }));
  });

  it('entidade undoable false não oferece Desfazer', async () => {
    const get = vi.fn().mockResolvedValue({ id: '3', nome: 'NF', valor: 500, _version: 'v0' });
    const update = vi.fn().mockResolvedValue({ id: '3', nome: 'NF', valor: 900, _version: 'v1' });
    const Record = agentUiRenderers['c3.record'];
    setup({ get, update }, <Record part={part('c3.record', draft)} open onAnswer={vi.fn().mockResolvedValue(true)} />, {
      ...negocio,
      undoable: false
    });
    fireEvent.click(await screen.findByRole('button', { name: 'Gravar alteração' }));
    expect(await screen.findByText(/Gravado/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Desfazer' })).toBeNull();
  });

  it('ação com inverse: Desfazer roda a inversa com a versão de depois e C3-Undo', async () => {
    const get = vi.fn().mockResolvedValue({ id: '3', nome: 'Padaria', _version: 'v0' });
    const action = vi
      .fn()
      .mockResolvedValueOnce({ data: { id: '3', nome: 'Padaria', _version: 'v1' }, message: 'Ganho.' })
      .mockResolvedValueOnce({ data: { id: '3', nome: 'Padaria', _version: 'v2' }, message: null });
    const onAnswer = vi.fn().mockResolvedValue(true);
    const Action = agentUiRenderers['c3.action'];
    setup({ get, action }, <Action part={part('c3.action', { entity: 'negocio', id: '3', action: 'ganhar' })} open onAnswer={onAnswer} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Ganhar' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Desfazer' }));
    await waitFor(() => expect(action).toHaveBeenLastCalledWith('negocio', '3', 'reabrir', {}, { ifMatch: 'v1', undo: true }));
    await waitFor(() => expect(onAnswer).toHaveBeenLastCalledWith({ action: 'undo', values: { id: '3' } }));
    expect(screen.getByText('Desfeito.')).toBeTruthy();
  });
});
