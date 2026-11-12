// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { mount } from '../../pageStates/pageStateFixture.test-utils';
import type { C3Client } from '../../api';
import { ApiError } from '../../api';
import type { DashboardDef } from '../../dashboard';
import SummaryPanel from './SummaryPanel';
import type { SummaryWidget } from '../../summaryDashboard';

afterEach(cleanup);
export const dashboard: DashboardDef = {
  source: { path: '/uso' },
  widgets: [
    {
      type: 'summary-kpi',
      title: { id: 'loading' },
      items: 'providers',
      label: 'name',
      value: 'input',
      progress: { label: 'Limite', limit: 'limit' },
      fields: [
        { label: 'Saída', field: 'output', format: 'number' },
        { label: 'Custo', field: 'cost', format: 'currency', currencyField: 'currency' },
        { label: 'Início', field: 'start', format: 'date' },
        { label: 'Fim', field: 'end', format: 'date' }
      ]
    },
    { type: 'summary-ranking', title: 'Agentes', items: 'agents', label: 'name', value: 'tokens' },
    {
      type: 'summary-object',
      title: 'Atualização',
      state: 'update.state',
      states: { available: { label: 'Disponível', warning: 'Atualize quando puder' }, ready: { label: 'Pronto' } },
      fields: [
        { label: 'Atual', field: 'update.current' },
        { label: 'Nova', field: 'update.next' }
      ],
      warnings: [{ field: 'update.channel', equals: 'beta', message: 'Canal de testes beta' }],
      message: 'update.message',
      progress: { label: 'Download', value: 'update.download', limit: 'update.total' },
      actions: [
        { label: 'Instalar', path: '/update/install', disabled: 'update.disabled', instruction: 'update.instruction' },
        { label: 'Verificar', path: '/update/check' }
      ]
    }
  ]
};
const data = {
  providers: [{ name: 'Exemplo', input: 25, output: 10, limit: 100, cost: 1.5, currency: 'BRL', start: '2026-11-01', end: '2026-11-30' }],
  agents: [
    { name: 'Menor', tokens: 10 },
    { name: 'Maior', tokens: 30 }
  ],
  update: {
    state: 'available',
    channel: 'beta',
    current: '1.0',
    next: '1.1',
    download: 40,
    total: 100,
    disabled: true,
    instruction: 'Feche o trabalho antes',
    message: 'Nova versão encontrada'
  }
};
const page = () => <p>unused</p>;
it('renderiza os três blocos sem entidade, traduz Text, compartilha GET e executa POST/atualiza', async () => {
  let updated = false;
  const summary = vi.fn(async (_path: string, method?: string) => {
    if (method === 'POST') {
      updated = true;
      return null;
    }
    return updated ? { ...data, update: { ...data.update, state: 'ready' } } : data;
  });
  mount(page, { dashboard, client: { summary } as unknown as C3Client });
  expect(await screen.findByText('Exemplo')).toBeTruthy();
  expect(screen.getByText('Carregando pedidos')).toBeTruthy();
  expect(screen.getByText('Limite: 25%')).toBeTruthy();
  expect(screen.getByText('Maior: 30 · 75%')).toBeTruthy();
  expect(screen.getByText('Menor: 10 · 25%')).toBeTruthy();
  expect(screen.getByText('Disponível')).toBeTruthy();
  expect(screen.getByText('Canal de testes beta')).toBeTruthy();
  expect(screen.getByText('Feche o trabalho antes')).toBeTruthy();
  expect((screen.getByText('Instalar') as HTMLButtonElement).disabled).toBe(true);
  expect(summary).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByText('Verificar'));
  expect(await screen.findByText('Pronto')).toBeTruthy();
  expect(summary).toHaveBeenCalledWith('/update/check', 'POST');
});
it('mostra falha da ação sem perder os dados nem deixar o botão travado', async () => {
  const summary = vi.fn(async (_path: string, method?: string) => {
    if (method === 'POST') throw new Error('Falhou ao verificar');
    return data;
  });
  mount(page, { dashboard, client: { summary } as unknown as C3Client });
  fireEvent.click(await screen.findByText('Verificar'));
  expect(await screen.findByText('Falhou ao verificar')).toBeTruthy();
  expect(screen.getByText('Exemplo')).toBeTruthy();
  await waitFor(() => expect((screen.getByText('Verificar') as HTMLButtonElement).disabled).toBe(false));
});
it('mostra carregamento e erro de consulta no cartão', async () => {
  let fail!: (reason: unknown) => void;
  mount(page, {
    dashboard: { widgets: [dashboard.widgets[0]], source: dashboard.source },
    client: {
      summary: () =>
        new Promise((_, reject) => {
          fail = reject;
        })
    } as unknown as C3Client
  });
  expect(screen.getByRole('progressbar')).toBeTruthy();
  await waitFor(() => expect(fail).toBeTruthy());
  fail(new Error('Servidor indisponível'));
  expect(await screen.findByText('Servidor indisponível')).toBeTruthy();
});

it('declara fontes por widget e apresenta dados ausentes com segurança', async () => {
  const widgets: SummaryWidget[] = [
    { type: 'summary-kpi', title: 'Único', value: 'zero', progress: { label: 'Sem limite', limit: 'missing' } },
    { type: 'summary-kpi', title: 'Coleção ausente', items: 'missing', value: 'zero', label: 'name' },
    { type: 'summary-ranking', title: 'Ranking inválido', items: 'missing', label: 'name', value: 'tokens', share: 'percent' },
    { type: 'summary-ranking', title: 'Percentuais', items: 'rows', label: 'name', value: 'tokens', share: 'percent', limit: 1 },
    { type: 'summary-object', title: 'Objeto', fields: [], state: 'missing', states: {} }
  ];
  mount(page, {
    dashboard: { widgets: widgets.map((w) => ({ ...w, source: { path: '/outro' } })) },
    client: { summary: async () => ({ zero: 0, rows: [{ tokens: 'bad', percent: 120 }] }) } as unknown as C3Client
  });
  expect(await screen.findByText('0')).toBeTruthy();
  expect(screen.getByText('Sem limite: 0%')).toBeTruthy();
  expect(screen.getByText('—: 0 · 100%')).toBeTruthy();
});

it('fonte ausente e cliente antigo produzem erro explícito', async () => {
  const widget: SummaryWidget = { type: 'summary-kpi', title: 'Compatibilidade', value: 'n' };
  const Missing = () => (
    <>
      <SummaryPanel widget={widget} />
      <SummaryPanel widget={widget} source={{ path: '/x' }} />
    </>
  );
  mount(Missing, { client: {} as C3Client });
  expect(screen.getByText('Fonte de resumo ausente.')).toBeTruthy();
  expect(await screen.findByText('Cliente sem suporte a resumo.')).toBeTruthy();
});

it.each([500, 403])('revalidação com erro %s conserva cache somente enquanto autorizado', async (status) => {
  let failed = false;
  const summary = vi.fn(async (_path: string, method?: string) => {
    if (method === 'POST') {
      failed = true;
      return null;
    }
    if (failed) throw new ApiError(status, 'failed', 'Consulta falhou');
    return data;
  });
  mount(page, { dashboard, client: { summary } as unknown as C3Client });
  fireEvent.click(await screen.findByText('Verificar'));
  if (status === 403) {
    expect((await screen.findAllByText('Sem acesso a estes dados na filial atual.')).length).toBeGreaterThan(0);
    expect(screen.queryByText('Exemplo')).toBeNull();
  } else {
    expect((await screen.findAllByText('Consulta falhou')).length).toBeGreaterThan(0);
    expect(screen.getByText('Exemplo')).toBeTruthy();
  }
});
