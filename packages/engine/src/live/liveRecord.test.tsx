// @vitest-environment jsdom
// Registro aberto em leitura relê com o aviso do `live`; editando, não (#8).
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { MemoryRouter } from 'react-router';
import { SWRConfig } from 'swr';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { C3Client } from '../api';
import { EngineProvider } from '../context';
import EntityForm from '../pages/EntityForm';
import type { Capabilities, EntityDef } from '../types';
import type { LiveMessage } from './sse';

afterEach(cleanup);

const ALL: Capabilities = { list: true, read: true, create: true, update: true, delete: false };
const aparelho: EntityDef = {
  name: 'aparelho',
  label: { singular: 'Aparelho', plural: 'Aparelhos' },
  titleField: 'nome',
  live: true,
  fields: [
    { name: 'nome', type: 'string', label: 'Nome' },
    { name: 'situacao', type: 'string', label: 'Situação' }
  ]
};

function setup() {
  let send: (m: LiveMessage) => void = () => {};
  const events = vi.fn((_e: string, on: (m: LiveMessage) => void, signal: AbortSignal) => {
    send = on;
    on({ type: 'ready' });
    return new Promise<void>((resolve) => signal.addEventListener('abort', () => resolve()));
  });
  let situacao = 'conectando';
  const get = vi.fn(async () => ({ id: '7', nome: 'Loja', situacao }));
  const value = {
    client: { get, events } as unknown as C3Client,
    app: { name: 'demo' } as never,
    entities: { aparelho: { def: aparelho, capabilities: ALL } },
    components: {}
  };
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <IntlProvider locale="pt-BR" onError={() => {}}>
        <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
          <MemoryRouter>
            <EngineProvider value={value}>
              <EntityForm entity="aparelho" id="7" />
            </EngineProvider>
          </MemoryRouter>
        </SWRConfig>
      </IntlProvider>
    </ThemeProvider>
  );
  const change = (id: string | null, next: string) => {
    situacao = next;
    act(() => send({ type: 'change', change: 'updated', id }));
  };
  return { get, events, change };
}

describe('registro aberto com live', () => {
  it('em leitura, o aviso do registro relê os campos', async () => {
    const { get, events, change } = setup();
    expect(await screen.findByDisplayValue('conectando')).toBeTruthy();
    expect(events).toHaveBeenCalledWith('aparelho', expect.any(Function), expect.any(AbortSignal));
    change('8', 'qr');
    change('7', 'conectado');
    expect(await screen.findByDisplayValue('conectado')).toBeTruthy();
    expect(get).toHaveBeenCalledTimes(2);
  });

  it('aviso de outro registro não relê', async () => {
    const { get, change } = setup();
    await screen.findByDisplayValue('conectando');
    change('8', 'qr');
    await new Promise((r) => setTimeout(r, 400));
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('editando, não relê por cima do que está na tela', async () => {
    const { get, change } = setup();
    fireEvent.click(await screen.findByRole('button', { name: 'Editar' }));
    change('7', 'conectado');
    await new Promise((r) => setTimeout(r, 400));
    expect(get).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.getByDisplayValue('conectando')).toBeTruthy());
  });
});
