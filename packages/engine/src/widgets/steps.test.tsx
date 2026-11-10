// @vitest-environment jsdom
// Ação da lista em etapas (#53): barra com "done de total", a mensagem parcial, Parar e o fim com a mensagem final.
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { MemoryRouter } from 'react-router';
import { SWRConfig } from 'swr';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Notifier } from '@c3theme/ui';
import { ApiError } from '../api';
import { EngineProvider } from '../context';
import { createMemoryClient } from '../memory/memoryClient';
import type { ActionResult, EntityDef } from '../types';
import ListActions from './ListActions';

afterEach(cleanup);

const ncm = {
  name: 'ncm',
  label: { singular: 'NCM', plural: 'NCMs' },
  fields: [{ name: 'codigo', type: 'string', label: 'Código' }],
  actions: [{ name: 'revisar', label: 'Revisar NCMs', target: 'list', steps: true, successMessage: 'Revisão concluída.' }]
} as unknown as EntityDef;

function mount(listAction: (e: string, a: string, input?: unknown, cursor?: unknown) => Promise<ActionResult>) {
  const client = { listAction: vi.fn(listAction) };
  const entities = { ncm: { def: ncm, capabilities: { list: true, read: true, actions: { revisar: true } } } };
  const swr = { provider: () => new Map() };
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <IntlProvider locale="pt-BR" onError={() => {}}>
        <SWRConfig value={swr}>
          <EngineProvider value={{ client: client as never, app: { name: 'x' } as never, entities: entities as never, components: {} }}>
            <MemoryRouter>
              <ListActions entity="ncm" />
              <Notifier />
            </MemoryRouter>
          </EngineProvider>
        </SWRConfig>
      </IntlProvider>
    </ThemeProvider>
  );
  return client.listAction;
}

/** Cada chamada espera o teste soltar: `next(resposta)`. */
function gate() {
  const pending: ((r: ActionResult | Error) => void)[] = [];
  const call = () => new Promise<ActionResult>((ok, fail) => pending.push((r) => (r instanceof Error ? fail(r) : ok(r))));
  const next = async (r: ActionResult | Error) => {
    await waitFor(() => expect(pending.length).toBeGreaterThan(0));
    await act(async () => pending.shift()!(r));
  };
  return { call, next };
}

describe('ação em etapas', () => {
  it('repete com o cursor até done == total, mostra o andamento e termina com a mensagem final', async () => {
    const g = gate();
    const listAction = mount(g.call);
    fireEvent.click(screen.getByRole('button', { name: 'Revisar NCMs' }));
    expect(await screen.findByText('Começando…')).toBeTruthy();
    await g.next({ message: 'Aplicados 10, fila 3.', progress: { total: 45, done: 15, cursor: 15 } });
    expect(await screen.findByText('15 de 45')).toBeTruthy();
    expect(screen.getByText('Aplicados 10, fila 3.')).toBeTruthy();
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('33');
    await g.next({ message: null, progress: { total: 45, done: 30, cursor: 30 } });
    await g.next({ message: null, progress: { total: 45, done: 45, cursor: null } });
    expect(await screen.findByText('Revisão concluída.')).toBeTruthy();
    expect(listAction.mock.calls.map((c) => c[3])).toEqual([undefined, 15, 30]);
    await waitFor(() => expect(screen.queryByText(/de 45/)).toBeNull());
  });

  it('Parar espera a etapa em curso e não chama de novo; o aviso diz até onde foi', async () => {
    const g = gate();
    const listAction = mount(g.call);
    fireEvent.click(screen.getByRole('button', { name: 'Revisar NCMs' }));
    await g.next({ progress: { total: 300, done: 15, cursor: 15 } });
    await g.next({ progress: { total: 300, done: 30, cursor: 30 } });
    fireEvent.click(await screen.findByRole('button', { name: 'Parar' }));
    expect(screen.getByRole('button', { name: 'Parando…' })).toHaveProperty('disabled', true);
    await g.next({ progress: { total: 300, done: 45, cursor: 45 } });
    expect(await screen.findByText('Parado em 45 de 300. O que já rodou ficou gravado.')).toBeTruthy();
    expect(listAction).toHaveBeenCalledTimes(3);
  });

  it('erro numa etapa fica na barra, com Fechar', async () => {
    const g = gate();
    mount(g.call);
    fireEvent.click(screen.getByRole('button', { name: 'Revisar NCMs' }));
    await g.next({ progress: { total: 30, done: 15, cursor: 15 } });
    await g.next(new ApiError(502, 'upstream', 'API fiscal fora do ar.'));
    expect(await screen.findByText(/API fiscal fora do ar\. O que as etapas anteriores gravaram fica\./)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    await waitFor(() => expect(screen.queryByText(/API fiscal/)).toBeNull());
  });

  it('a resposta sem progress encerra na primeira chamada; o memory client roda o handler com o cursor', async () => {
    const client = createMemoryClient({
      app: { name: 'x', entities: ['ncm'] } as never,
      entities: [ncm],
      listActions: { ncm: { revisar: (_input, cursor) => ({ message: `cursor ${String(cursor)}` }) } }
    });
    expect(await client.listAction('ncm', 'revisar', {}, 7)).toEqual({ message: 'cursor 7' });
    await expect(client.listAction('ncm', 'outra')).rejects.toThrow();
    const g = gate();
    mount(g.call);
    fireEvent.click(screen.getByRole('button', { name: 'Revisar NCMs' }));
    await g.next({ message: 'Nada pendente.' });
    expect(await screen.findByText('Nada pendente.')).toBeTruthy();
  });
});
