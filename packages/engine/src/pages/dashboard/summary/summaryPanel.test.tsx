// @vitest-environment jsdom
// #108: painel por resumo, os três blocos a partir de um endpoint sem entidade, e o painel de entidade como antes.
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { MemoryRouter } from 'react-router';
import { SWRConfig } from 'swr';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createClient, type C3Client } from '../../../api';
import { EngineProvider } from '../../../context';
import type { DashboardDef } from '../../../dashboard';
import { createMemoryClient } from '../../../memory/memoryClient';
import Dashboard from '../Dashboard';

afterEach(cleanup);

let state = 'baixando';
const doc = () => ({
  provedores: [
    { nome: 'Anthropic', t: { total: 850, limite: 1000, entrada: 600 }, custo: 41.3, moeda: 'USD' },
    { nome: 'Sem limite', t: { total: 5 } }
  ],
  agentes: [
    { nome: 'Revisor', tokens: 300 },
    { nome: 'Atendimento', tokens: 100 }
  ],
  app: {
    estado: state,
    canal: 'beta',
    atual: '2.3.1',
    progresso: state === 'baixando' ? 40 : undefined,
    mensagem: state === 'erro' ? 'Disco cheio.' : undefined,
    actions:
      state === 'baixando'
        ? { instalar: { disabled: true, instruction: 'Espere o download terminar.' } }
        : { tentar: {}, instalar: { disabled: false } }
  }
});

const DASH: DashboardDef = {
  source: { path: '/uso' },
  widgets: [
    {
      type: 'meter',
      title: 'Uso por provedor',
      from: 'provedores',
      label: 'nome',
      value: 't.total',
      limit: 't.limite',
      details: [
        { label: 'Entrada', value: 't.entrada' },
        { label: 'Custo', value: 'custo', format: 'money', currency: 'moeda' }
      ]
    },
    { type: 'share', title: 'Por agente', from: 'agentes', label: 'nome', value: 'tokens' },
    {
      type: 'status',
      title: 'Atualização',
      from: 'app',
      state: 'estado',
      states: { baixando: { label: 'Baixando', tone: 'info' }, erro: { label: 'Falhou', tone: 'danger' } },
      fields: [{ label: 'Versão atual', value: 'atual', format: 'text' }],
      notices: [{ when: { field: 'canal', op: 'eq', value: 'beta' }, text: 'Canal beta.', tone: 'warning' }],
      progress: 'progresso',
      message: 'mensagem',
      actions: [
        { id: 'tentar', label: 'Tentar de novo', path: '/app/tentar' },
        { id: 'instalar', label: 'Instalar', path: '/app/instalar' }
      ]
    }
  ]
};

function mount(client: C3Client, dashboard: DashboardDef = DASH) {
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <IntlProvider locale="en-US" onError={() => {}}>
        <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
          <EngineProvider value={{ client, app: { name: 'x' } as never, entities: {}, components: {} }}>
            <MemoryRouter>
              <Dashboard dashboard={dashboard} />
            </MemoryRouter>
          </EngineProvider>
        </SWRConfig>
      </IntlProvider>
    </ThemeProvider>
  );
}

const memory = (actions: Record<string, () => unknown> = {}) =>
  createMemoryClient({ app: { name: 'x', entities: [] } as never, entities: [], summaries: { '/uso': doc }, summaryActions: actions });

describe('painel por resumo', () => {
  it('mostra uso com limite, participação e o card de estado sem entidade', async () => {
    state = 'baixando';
    mount(memory());
    expect(await screen.findByText('850 de 1,000 · 85%')).toBeTruthy();
    expect(screen.getByRole('progressbar', { name: 'Anthropic: 85% do limite' })).toBeTruthy();
    expect(screen.getByText('$41.30')).toBeTruthy();
    expect(screen.getByText('5')).toBeTruthy();
    expect(screen.queryByRole('progressbar', { name: /Sem limite/ })).toBeNull();
    expect(screen.getByRole('progressbar', { name: 'Revisor: 75% do total' })).toBeTruthy();
    expect(screen.getByText('Baixando')).toBeTruthy();
    expect(screen.getByText('2.3.1')).toBeTruthy();
    expect(screen.getByText('Canal beta.')).toBeTruthy();
    expect(screen.getByRole('progressbar', { name: 'Atualização: 40%' })).toBeTruthy();
    const install = screen.getByRole('button', { name: 'Instalar' }) as HTMLButtonElement;
    expect(install.disabled).toBe(true);
    expect(install.getAttribute('aria-describedby')).toBe('instalar-instrucao');
    expect(screen.getByText('Espere o download terminar.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Tentar de novo' })).toBeNull();
  });

  it('a ação faz o POST e a resposta com o resumo novo redesenha o card', async () => {
    state = 'erro';
    const tentar = vi.fn(() => {
      state = 'baixando';
      return doc();
    });
    mount(memory({ '/app/tentar': tentar }));
    expect(await screen.findByText('Disco cheio.')).toBeTruthy();
    expect(screen.getByText('Falhou')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    await waitFor(() => expect(screen.getByText('Baixando')).toBeTruthy());
    expect(tentar).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Disco cheio.')).toBeNull();
  });

  it('erro do resumo fica no widget, e widget sem source avisa', async () => {
    mount(createMemoryClient({ app: { name: 'x', entities: [] } as never, entities: [] }), {
      widgets: [
        { type: 'share', title: 'A', from: 'x', label: 'n', value: 'v', source: { path: '/nao' } },
        { type: 'meter', title: 'B', from: 'x', label: 'n', value: 'v' }
      ]
    });
    expect(await screen.findByText(/O resumo precisa do backend/)).toBeTruthy();
    expect(screen.getByText(/Widget sem source/)).toBeTruthy();
  });

  it('caminho sem itens mostra o vazio declarado', async () => {
    mount(memory(), {
      source: { path: '/uso' },
      widgets: [
        { type: 'meter', title: 'A', from: 'nada', label: 'n', value: 'v', empty: 'Sem uso ainda.' },
        { type: 'share', title: 'B', from: 'nada', label: 'n', value: 'v', chart: 'donut' },
        { type: 'status', title: 'C', from: 'nada', state: 's', states: { x: { label: 'X' } } }
      ]
    });
    expect(await screen.findByText('Sem uso ainda.')).toBeTruthy();
    expect(screen.getAllByText('Nada por aqui.')).toHaveLength(2);
  });
});

describe('cliente HTTP do resumo', () => {
  it('GET devolve data; POST devolve o data da resposta ou undefined no 204', async () => {
    const fetch = vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === 'GET')
        return new Response(JSON.stringify({ data: { ok: 1 } }), { headers: { 'content-type': 'application/json' } });
      if (url.endsWith('/nada')) return new Response(null, { status: 204 });
      return new Response(JSON.stringify({ data: { ok: 2 } }), { headers: { 'content-type': 'application/json' } });
    });
    const client = createClient('/api', undefined, undefined, fetch as unknown as typeof globalThis.fetch);
    expect(await client.summary!('/uso')).toEqual({ ok: 1 });
    expect(await client.summaryAction!('/app/tentar')).toEqual({ ok: 2 });
    expect(await client.summaryAction!('/app/nada')).toBeUndefined();
    expect(fetch).toHaveBeenCalledWith('/api/app/tentar', expect.objectContaining({ method: 'POST', body: '{}' }));
  });
});
