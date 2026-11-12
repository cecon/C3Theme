// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { EngineState } from '../context';
import { usePageState } from './context';
import { mount, states } from './pageStateFixture.test-utils';
afterEach(cleanup);
describe('page state record action', () => {
  it('sem capacidade o botão fica desabilitado e o alvo não é consultado', async () => {
    const client = { get: vi.fn() } as unknown as EngineState['client'];
    function Page() {
      usePageState({ empty: true });
      return <p />;
    }
    mount(Page, {
      states: {
        ...states,
        empty: { message: 'Sem pedidos', action: { label: 'Preparar', record: { entity: 'pedido', id: '1', action: 'enviar' } } }
      },
      client
    });
    expect(await screen.findByText('Sem pedidos')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Preparar' }) as HTMLButtonElement).disabled).toBe(true);
    expect(client.get).not.toHaveBeenCalled();
  });
  it('ação de registro usa RecordActions, capacidade e registro carregado', async () => {
    const client = {
      get: vi.fn(async () => ({ id: '1', _version: 'v1', nome: 'Pedido' })),
      action: vi.fn(async () => ({ message: 'Enviado' }))
    } as unknown as EngineState['client'];
    const entities = {
      pedido: {
        def: {
          name: 'pedido',
          label: { singular: 'Pedido', plural: 'Pedidos' },
          fields: [{ name: 'nome', type: 'string' }],
          actions: [{ name: 'enviar', label: 'Enviar' }]
        },
        capabilities: { create: false, update: false, delete: false, list: true, read: true, actions: { enviar: true } }
      }
    } as EngineState['entities'];
    function Page() {
      usePageState({ empty: true });
      return <p />;
    }
    mount(Page, {
      states: {
        ...states,
        empty: { message: 'Sem pedidos', action: { label: 'Preparar envio', record: { entity: 'pedido', id: '1', action: 'enviar' } } }
      },
      client,
      entities
    });
    await screen.findByRole('button', { name: 'Preparar envio' });
    await waitFor(() => expect((screen.getByRole('button', { name: 'Preparar envio' }) as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(screen.getByRole('button', { name: 'Preparar envio' }));
    await waitFor(() => expect(client.action).toHaveBeenCalledWith('pedido', '1', 'enviar', {}, { ifMatch: 'v1' }));
    expect(client.get).toHaveBeenCalledWith('pedido', '1');
  });

  it('GET do alvo falho oferece retry e não executa ação sem registro', async () => {
    const get = vi.fn().mockRejectedValueOnce(new Error('Alvo indisponível')).mockResolvedValue({ id: '1', _version: 'v2' });
    const client = { get, action: vi.fn(async () => ({})) } as unknown as EngineState['client'];
    const entities = {
      pedido: {
        def: {
          name: 'pedido',
          label: { singular: 'Pedido', plural: 'Pedidos' },
          fields: [],
          actions: [{ name: 'enviar', label: 'Enviar' }]
        },
        capabilities: {
          create: false,
          update: false,
          delete: false,
          list: true,
          read: true,

          actions: { enviar: true }
        }
      }
    } as EngineState['entities'];
    function Page() {
      usePageState({ empty: true });
      return <p />;
    }
    mount(Page, {
      states: {
        ...states,
        empty: { message: 'Sem pedidos', action: { label: 'Preparar', record: { entity: 'pedido', id: '1', action: 'enviar' } } }
      },
      client,
      entities
    });
    expect(await screen.findByText('Alvo indisponível')).toBeTruthy();
    expect(client.action).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    await waitFor(() => expect((screen.getByRole('button', { name: 'Preparar' }) as HTMLButtonElement).disabled).toBe(false));
    expect(get).toHaveBeenCalledTimes(2);
  });
});
