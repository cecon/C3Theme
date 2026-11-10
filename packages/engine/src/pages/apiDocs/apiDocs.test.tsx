// @vitest-environment jsdom
// Página apiDocs (#33): lê o openapi.json pelo cliente, busca, abre a rota e experimenta (GET roda, POST na memória é 501).
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import type { C3Client } from '../../api';
import { EngineProvider } from '../../context';
import { createMemoryClient } from '../../memory/memoryClient';
import type { EntityDef } from '../../types';
import ApiDocs from './ApiDocs';

afterEach(cleanup);

const cliente = {
  name: 'cliente',
  label: { singular: 'Cliente', plural: 'Clientes' },
  fields: [{ name: 'nome', type: 'string' }]
} as unknown as EntityDef;
const DOC = {
  info: { title: 'API da loja', version: 'v1' },
  tags: [{ name: 'Clientes', description: 'Cadastro' }],
  paths: {
    '/cliente/{id}': {
      get: {
        tags: ['Clientes'],
        summary: 'Lê o cliente',
        parameters: [{ name: 'id', in: 'path', example: '1' }],
        responses: { '200': { description: 'O cliente', content: { 'application/json': { schema: { type: 'object' } } } } }
      }
    },
    '/cliente': {
      post: {
        tags: ['Clientes'],
        summary: 'Cria',
        requestBody: { content: { 'application/json': { example: { nome: 'Rita' } } } },
        responses: { '201': { description: 'Criado' } }
      }
    }
  }
};

function mount(client: C3Client, spec = '/openapi.json') {
  const value = { client, app: { name: 'Loja' } as never, entities: {} as never, components: {} };
  render(
    <EngineProvider value={value}>
      <ApiDocs def={{ spec }} />
    </EngineProvider>
  );
}

const memory = () =>
  createMemoryClient({
    app: { name: 'Loja', entities: ['cliente'] } as never,
    entities: [cliente],
    records: { cliente: [{ id: '1', nome: 'Ana' }] },
    files: { '/openapi.json': DOC, '/ruim.json': 'x' }
  });

describe('página apiDocs', () => {
  it('lista por tag, busca e experimenta um GET com a resposta do cliente', async () => {
    mount(memory());
    expect(await screen.findByText('API da loja')).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Clientes' })).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Buscar rota'), { target: { value: 'zzz' } });
    expect(screen.getByText(/Nenhuma rota/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Buscar rota'), { target: { value: 'lê' } });
    expect(screen.queryByText('/cliente')).toBeNull();
    fireEvent.click(screen.getByText('/cliente/{id}'));
    expect(screen.getByText('Experimentar')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    expect((await screen.findByRole('status')).textContent).toBe('Status 200');
    expect(screen.getByText(/"nome": "Ana"/)).toBeTruthy();
  });

  it('POST com o corpo do exemplo; JSON inválido avisa; a memória responde 501', async () => {
    mount(memory());
    fireEvent.click(await screen.findByText('/cliente'));
    const body = screen.getByLabelText('Corpo (JSON)');
    expect((body as HTMLTextAreaElement).value).toContain('"nome": "Rita"');
    fireEvent.change(body, { target: { value: '{' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(await screen.findByText('O corpo não é um JSON válido.')).toBeTruthy();
    fireEvent.change(body, { target: { value: '{"nome":"Rita"}' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    expect((await screen.findByRole('status')).textContent).toBe('Status 501');
  });

  it('documento que não abre, JSON inválido e cliente sem pedido livre', async () => {
    mount(memory(), '/falta.json');
    expect(await screen.findByText(/status 501/)).toBeTruthy();
    cleanup();
    const client = memory();
    client.raw = async () => ({ status: 200, contentType: 'application/json', body: '{' });
    mount(client);
    expect(await screen.findByText('/openapi.json não é um JSON válido.')).toBeTruthy();
    cleanup();
    mount({ ...memory(), raw: undefined });
    expect(await screen.findByText(/não faz pedido livre/)).toBeTruthy();
    cleanup();
    mount({ ...memory(), raw: () => Promise.reject(new Error('caiu')) });
    await waitFor(() => expect(screen.getByText('caiu')).toBeTruthy());
  });
});
