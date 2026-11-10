// @vitest-environment jsdom
// Página do assistente (#34): valida, grava cada passo, roda a ação, pula o opcional, mostra o resumo; e a guarda.
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter, Route, Routes } from 'react-router';
import { SWRConfig } from 'swr';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { C3Client } from '../../api';
import { EngineProvider } from '../../context';
import { createMemoryClient } from '../../memory/memoryClient';
import type { AppDef, EntityDef } from '../../types';
import type { WizardDef } from '../../wizard';
import WizardGuard from './WizardGuard';
import WizardPage from './WizardPage';

afterEach(cleanup);

const loja = {
  name: 'loja',
  label: { singular: 'Loja', plural: 'Lojas' },
  singleton: true,
  fields: [
    { name: 'nome', type: 'string', label: 'Nome', required: true },
    { name: 'caixa', type: 'integer', label: 'Caixa' },
    { name: 'impressora', type: 'string', label: 'Impressora' },
    { name: 'pendente', type: 'boolean', readOnly: true },
    { name: 'tem_cert', type: 'boolean', readOnly: true }
  ],
  actions: [{ name: 'criar_maquina', label: 'Criar' }]
} as unknown as EntityDef;
const wizard: WizardDef = {
  entity: 'loja',
  pending: 'pendente',
  steps: [
    { title: 'A loja', rows: [['nome']] },
    { title: 'O caixa', rows: [['caixa']], action: 'criar_maquina' },
    { title: 'Impressora', rows: [['impressora']], optional: true }
  ],
  summary: {
    title: 'Pronto',
    items: [
      { label: 'Certificado', done: 'tem_cert', path: '/loja' },
      { label: 'Ajuda', path: '/ajuda' }
    ]
  }
};
const app = { name: 'x', entities: ['loja'], pages: [{ path: '/inicio', wizard }], layout: { menu: [] } } as unknown as AppDef;

function setup(records: Record<string, unknown>[] = []) {
  const ran = vi.fn(() => ({}));
  const client = createMemoryClient({
    app,
    entities: [loja],
    records: { loja: records as never },
    onSave: { loja: (r) => ({ pendente: !(r.nome && r.caixa) }) },
    actions: { loja: { criar_maquina: ran } }
  });
  return { client, ran };
}

function mount(client: C3Client, path: string, w = wizard) {
  const value = { client, app, entities: { loja: { def: loja, capabilities: { create: true, update: true } } } as never, components: {} };
  const swr = { provider: () => new Map() };
  render(
    <IntlProvider locale="pt-BR" onError={() => {}}>
      <SWRConfig value={swr}>
        <EngineProvider value={value}>
          <MemoryRouter initialEntries={[path]}>
            <WizardGuard>
              <Routes>
                <Route path="/inicio" element={<WizardPage wizard={w} />} />
                <Route path="/" element={<p>Início</p>} />
                <Route path="/cliente" element={<p>Clientes</p>} />
              </Routes>
            </WizardGuard>
          </MemoryRouter>
        </EngineProvider>
      </SWRConfig>
    </IntlProvider>
  );
}

const next = () => fireEvent.click(screen.getByRole('button', { name: 'Avançar' }));

describe('assistente em passos', () => {
  it('guarda leva ao assistente; passos validam, gravam e rodam a ação; resumo e Concluir', async () => {
    const { client, ran } = setup([{ id: '1', nome: null, pendente: true }]);
    mount(client, '/cliente');
    expect(await screen.findByRole('heading', { name: 'A loja' })).toBeTruthy();
    next();
    expect(await screen.findByText('Campo obrigatório.')).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/Nome/), { target: { value: 'Loja 1' } });
    next();
    expect(await screen.findByRole('heading', { name: 'O caixa' })).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Caixa'), { target: { value: '3' } });
    next();
    expect(await screen.findByRole('heading', { name: 'Impressora' })).toBeTruthy();
    expect(ran).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Pular' }));
    expect(await screen.findByRole('heading', { name: 'Pronto' })).toBeTruthy();
    expect(screen.getByText('Falta')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Ajuda' })).toBeTruthy();
    await waitFor(() => expect((screen.getByRole('button', { name: 'Concluir' }) as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(screen.getByRole('button', { name: 'Concluir' }));
    expect(await screen.findByText('Início')).toBeTruthy();
    expect((await client.get('loja', '1')).caixa).toBe(3);
  });

  it('sem registro, o primeiro passo cria; sem resumo, o último passo conclui', async () => {
    const { client } = setup();
    mount(client, '/inicio', { entity: 'loja', steps: [{ title: 'Único', rows: [['nome', 'caixa']] }] });
    expect(await screen.findByRole('heading', { name: 'Único' })).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/Nome/), { target: { value: 'L' } });
    fireEvent.change(screen.getByLabelText('Caixa'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Concluir' }));
    expect(await screen.findByText('Início')).toBeTruthy();
    expect((await client.list('loja')).data[0].nome).toBe('L');
  });

  it('não pendente não prende; erro da ação aparece no passo; entidade que falta avisa', async () => {
    const { client } = setup([{ id: '1', nome: 'L', caixa: 1, pendente: false }]);
    mount(client, '/cliente');
    expect(await screen.findByText('Clientes')).toBeTruthy();
    cleanup();
    const failing = setup([{ id: '1', nome: 'L', pendente: true }]).client;
    failing.action = () => Promise.reject(new Error('Sem hardware'));
    mount(failing, '/inicio', { ...wizard, steps: [wizard.steps[1]] });
    fireEvent.change(await screen.findByLabelText('Caixa'), { target: { value: '2' } });
    next();
    expect(await screen.findByText('Sem hardware')).toBeTruthy();
    cleanup();
    mount(client, '/inicio', { ...wizard, entity: 'outra' });
    expect(await screen.findByText(/não está em app.entities/)).toBeTruthy();
  });
});
