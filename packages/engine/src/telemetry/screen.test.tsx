// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { MemoryRouter } from 'react-router';
import type { ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { C3Client } from '../api';
import { EngineProvider } from '../context';
import EntityForm from '../pages/EntityForm';
import RecordActions from '../widgets/RecordActions';
import type { Capabilities, EntityDef } from '../types';
import type { TaskEvent } from '.';

afterEach(cleanup);

const ALL: Capabilities = { list: true, read: true, create: true, update: true, delete: true, actions: { arquivar: true } };
const cliente: EntityDef = {
  name: 'cliente',
  label: { singular: 'Cliente', plural: 'Clientes' },
  titleField: 'nome',
  fields: [
    { name: 'nome', type: 'string', label: 'Nome', required: true },
    { name: 'cidade', type: 'string', label: 'Cidade' }
  ],
  actions: [{ name: 'arquivar', label: 'Arquivar' }]
};

function setup(client: Partial<C3Client>, ui: ReactNode) {
  const events: TaskEvent[] = [];
  const value = {
    client: client as C3Client,
    app: { name: 'demo' } as never,
    entities: { cliente: { def: cliente, capabilities: ALL } },
    components: {},
    telemetry: (e: TaskEvent) => events.push(e)
  };
  const view = render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <IntlProvider locale="pt-BR" onError={() => {}}>
        <SWRConfig value={{ provider: () => new Map() }}>
          <MemoryRouter>
            <EngineProvider value={value}>{ui}</EngineProvider>
          </MemoryRouter>
        </SWRConfig>
      </IntlProvider>
    </ThemeProvider>
  );
  const types = () => events.map((e) => e.type);
  return { events, types, view };
}

describe('telemetria nas telas do motor', () => {
  it('novo: começa ao abrir e termina ao gravar, com os campos preenchidos', async () => {
    const create = vi.fn().mockResolvedValue({ id: '9', nome: 'Acme', cidade: null });
    const { events, types } = setup({ create }, <EntityForm entity="cliente" />);
    expect(types()).toEqual(['task.start']);
    fireEvent.change(screen.getByLabelText(/Nome/), { target: { value: 'Acme' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    await waitFor(() => expect(types()).toEqual(['task.start', 'task.done']));
    expect(events[1]).toMatchObject({ entity: 'cliente', op: 'create', channel: 'screen', fields: 1, taskId: events[0].taskId });
  });

  it('novo: sair sem gravar é abandono', () => {
    const { types, view } = setup({}, <EntityForm entity="cliente" />);
    view.unmount();
    expect(types()).toEqual(['task.start', 'task.abandon']);
  });

  it('gravado: só ver não é tarefa; Editar e Cancelar é abandono', async () => {
    const get = vi.fn().mockResolvedValue({ id: '7', nome: 'Acme', cidade: 'Lages' });
    const { events, types } = setup({ get }, <EntityForm entity="cliente" id="7" />);
    fireEvent.click(await screen.findByRole('button', { name: 'Editar' }));
    expect(types()).toEqual(['task.start']);
    expect(events[0].op).toBe('update');
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(types()).toEqual(['task.start', 'task.abandon']);
  });

  it('fechar a aba com o formulário aberto é abandono', () => {
    const { types } = setup({}, <EntityForm entity="cliente" />);
    act(() => {
      window.dispatchEvent(new Event('pagehide'));
    });
    expect(types()).toEqual(['task.start', 'task.abandon']);
  });

  it('ação sem diálogo: começa no clique e termina ao rodar', async () => {
    const action = vi.fn().mockResolvedValue({ data: { id: '7', nome: 'Acme' }, message: null });
    const { events, types } = setup({ action }, <RecordActions entity="cliente" id="7" record={{ id: '7', nome: 'Acme' }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Arquivar' }));
    await waitFor(() => expect(types()).toEqual(['task.start', 'task.done']));
    expect(events[1]).toMatchObject({ op: 'action', action: 'arquivar' });
  });
});
