// @vitest-environment jsdom
// Ação `opensForm` (#45): abre o cadastro de outra entidade com os valores do registro e grava o id criado nele.
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { MemoryRouter } from 'react-router';
import { SWRConfig } from 'swr';
import { afterEach, describe, expect, it } from 'vitest';

import { Notifier } from '@c3theme/ui';
import { EngineProvider } from '../context';
import { createMemoryClient } from '../memory/memoryClient';
import type { EntityDef } from '../types';
import RecordActions from './RecordActions';
import { openingValues } from './useOpensForm';

afterEach(cleanup);

const produto = {
  name: 'produto',
  label: { singular: 'Produto', plural: 'Produtos' },
  fields: [
    { name: 'nome', type: 'string', label: 'Nome', required: true },
    { name: 'preco', type: 'decimal', scale: 2, label: 'Preço', required: true }
  ]
} as unknown as EntityDef;
const item = {
  name: 'item',
  label: { singular: 'Item', plural: 'Itens' },
  fields: [
    { name: 'descricao', type: 'string', label: 'Descrição' },
    { name: 'valor', type: 'decimal', scale: 2, label: 'Valor' },
    { name: 'produto', type: 'reference', entity: 'produto', label: 'Produto' }
  ],
  actions: [
    {
      name: 'cadastrar',
      label: 'Cadastrar produto',
      opensForm: { entity: 'produto', values: { nome: 'descricao', preco: 'valor' }, assignTo: 'produto' }
    }
  ]
} as unknown as EntityDef;

function mount(create = true) {
  const client = createMemoryClient({
    app: { name: 'x', entities: ['item', 'produto'] } as never,
    entities: [item, produto],
    records: { item: [{ id: '1', descricao: 'CAFE 250G', valor: '12.90', produto: null }] }
  });
  const caps = { list: true, read: true, create, update: true, delete: true };
  const entities = {
    item: { def: item, capabilities: { ...caps, actions: { cadastrar: true } } },
    produto: { def: produto, capabilities: caps }
  };
  const swr = { provider: () => new Map() };
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <IntlProvider locale="pt-BR" onError={() => {}}>
        <SWRConfig value={swr}>
          <EngineProvider value={{ client, app: { name: 'x' } as never, entities: entities as never, components: {} }}>
            <MemoryRouter>
              <Notifier />
              <RecordActions entity="item" id="1" record={{ id: '1', descricao: 'CAFE 250G', valor: '12.90', produto: null }} />
            </MemoryRouter>
          </EngineProvider>
        </SWRConfig>
      </IntlProvider>
    </ThemeProvider>
  );
  return client;
}

describe('ação opensForm', () => {
  it('openingValues: destino ← origem, sem os vazios', () => {
    expect(openingValues({ a: 'x', b: 'y', c: 'z' }, { x: 1, y: '', z: null })).toEqual({ a: 1 });
    expect(openingValues(undefined, undefined)).toEqual({});
  });

  it('abre o cadastro preenchido, salva e grava o produto no item', async () => {
    const client = mount();
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar produto' }));
    const nome = (await screen.findByLabelText(/Nome/)) as HTMLInputElement;
    expect(nome.value).toBe('CAFE 250G');
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    await waitFor(async () => expect((await client.get('item', '1')).produto).toMatchObject({ id: expect.any(String) }));
    const [p] = (await client.list('produto')).data;
    expect(p).toMatchObject({ nome: 'CAFE 250G', preco: '12.90' });
    expect(await screen.findByText('Cadastrado e vinculado.')).toBeTruthy();
  });

  it('sem permissão de criar na entidade aberta, avisa e não abre', async () => {
    mount(false);
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar produto' }));
    expect(await screen.findByText('Você não tem permissão para cadastrar aqui.')).toBeTruthy();
    expect(screen.queryByLabelText(/Nome/)).toBeNull();
  });
});
