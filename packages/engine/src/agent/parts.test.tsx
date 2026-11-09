// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import type { ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { C3Client } from '../api';
import { EngineProvider } from '../context';
import type { Capabilities, EntityDef } from '../types';
import { agentUiRenderers } from '.';

afterEach(cleanup);

const ALL: Capabilities = { list: true, read: true, create: true, update: true, delete: true, actions: { bloquear: true } };
const cliente: EntityDef = {
  name: 'cliente',
  label: { singular: 'Cliente', plural: 'Clientes' },
  titleField: 'nome',
  fields: [
    { name: 'nome', type: 'string', label: 'Nome', required: true },
    { name: 'limite', type: 'integer', label: 'Limite', aiReview: true }
  ],
  actions: [
    { name: 'bloquear', label: 'Bloquear', tone: 'danger', input: { fields: [{ name: 'motivo', type: 'string', label: 'Motivo' }] } }
  ]
};

function setup(client: Partial<C3Client>, ui: ReactNode) {
  const value = {
    client: client as C3Client,
    app: { name: 'demo' } as never,
    entities: { cliente: { def: cliente, capabilities: ALL } },
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

describe('partes do assistente no motor', () => {
  it('c3.form envia os valores ao assistente', async () => {
    const onAnswer = vi.fn().mockResolvedValue(true);
    const Form = agentUiRenderers['c3.form'];
    setup(
      {},
      <Form
        part={part('c3.form', { fields: [{ name: 'motivo', type: 'string', label: 'Motivo', required: true }] })}
        open
        onAnswer={onAnswer}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(onAnswer).not.toHaveBeenCalled(); // obrigatório vazio
    fireEvent.change(screen.getByLabelText(/Motivo/), { target: { value: 'atraso' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    await waitFor(() => expect(onAnswer).toHaveBeenCalledWith({ action: 'accept', values: { motivo: 'atraso' } }));
  });

  it('parte substituída diz isso e não mostra os campos', () => {
    const Form = agentUiRenderers['c3.form'];
    const fields = [{ name: 'motivo', type: 'string', label: 'Motivo' }];
    setup({}, <Form part={{ ...part('c3.form', { fields }), state: 'cancelled', reason: 'superseded' }} open={false} />);
    expect(screen.getByText('Esta pergunta foi substituída por uma mais nova.')).toBeTruthy();
    expect(screen.queryByLabelText(/Motivo/)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Enviar' })).toBeNull();
  });

  it('c3.record: campo crítico sugerido trava até conferir; grava pelo CRUD e desfaz', async () => {
    const create = vi.fn().mockResolvedValue({ id: '9', nome: 'Acme', limite: 500, _version: 'v1' });
    const remove = vi.fn().mockResolvedValue(undefined);
    const onAnswer = vi.fn().mockResolvedValue(true);
    const Record = agentUiRenderers['c3.record'];
    const payload = { entity: 'cliente', values: { nome: 'Acme', limite: 500 }, suggested: { limite: 'do último pedido' } };
    setup({ create, remove }, <Record part={part('c3.record', payload)} open onAnswer={onAnswer} />);
    const gravar = screen.getByRole('button', { name: 'Gravar' }) as HTMLButtonElement;
    expect(gravar.disabled).toBe(true);
    expect(screen.getByText(/Confira este valor/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Conferi' }));
    fireEvent.click(gravar);
    await waitFor(() => expect(create).toHaveBeenCalledWith('cliente', { nome: 'Acme', limite: 500 }));
    await waitFor(() => expect(onAnswer).toHaveBeenCalledWith({ action: 'accept', values: { id: '9', title: 'Acme' } }));
    fireEvent.click(await screen.findByRole('button', { name: 'Desfazer' }));
    await waitFor(() => expect(remove).toHaveBeenCalledWith('cliente', '9', { ifMatch: 'v1', undo: true }));
    await waitFor(() => expect(onAnswer).toHaveBeenLastCalledWith({ action: 'undo', values: { id: '9' } }));
  });

  it('c3.action perigosa pede o segundo clique', async () => {
    const action = vi.fn().mockResolvedValue({ data: { id: '7', nome: 'Acme' }, message: 'Cliente bloqueado.' });
    const get = vi.fn().mockResolvedValue({ id: '7', nome: 'Acme' });
    const onAnswer = vi.fn().mockResolvedValue(true);
    const Action = agentUiRenderers['c3.action'];
    setup(
      { action, get },
      <Action
        part={part('c3.action', { entity: 'cliente', id: '7', action: 'bloquear', input: { motivo: 'atraso' } })}
        open
        onAnswer={onAnswer}
      />
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Bloquear' }));
    expect(action).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Sim, bloquear' }));
    await waitFor(() => expect(action).toHaveBeenCalledWith('cliente', '7', 'bloquear', { motivo: 'atraso' }));
    await waitFor(() => expect(onAnswer).toHaveBeenCalledWith({ action: 'accept', values: { message: 'Cliente bloqueado.' } }));
  });

  it('payload inválido vira aviso', () => {
    const Record = agentUiRenderers['c3.record'];
    setup({}, <Record part={part('c3.record', { entity: 'cliente', values: { senha: 'x' } })} open />);
    expect(screen.getByText(/rascunho inválido/)).toBeTruthy();
  });
});
