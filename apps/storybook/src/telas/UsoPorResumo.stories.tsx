import { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { C3Shell, type AppDef, type C3Fetch, type DashboardDef } from '@c3theme/engine';

const dashboard: DashboardDef = {
  source: { path: '/uso' },
  widgets: [
    {
      type: 'summary-kpi',
      title: 'Uso por provedor',
      items: 'providers',
      label: 'name',
      value: 'input',
      width: 6,
      progress: { label: 'Tokens de entrada / limite', limit: 'limit' },
      fields: [
        { label: 'Tokens de saída', field: 'output', format: 'number' },
        { label: 'Início da janela', field: 'start', format: 'date' },
        { label: 'Fim da janela', field: 'end', format: 'date' },
        { label: 'Custo estimado', field: 'cost', format: 'currency', currencyField: 'currency' }
      ]
    },
    { type: 'summary-ranking', title: 'Consumo por agente', items: 'agents', label: 'name', value: 'tokens', share: 'share', width: 6 },
    {
      type: 'summary-object',
      title: 'Atualização do aplicativo',
      width: 12,
      state: 'update.state',
      states: {
        checking: { label: 'Verificando' },
        available: { label: 'Atualização disponível' },
        downloading: { label: 'Baixando' },
        ready: { label: 'Pronto para instalar' },
        error: { label: 'Erro na atualização' }
      },
      fields: [
        { label: 'Versão atual', field: 'update.current' },
        { label: 'Versão disponível', field: 'update.next' },
        { label: 'Canal', field: 'update.channel' }
      ],
      warnings: [{ field: 'update.channel', equals: 'beta', message: 'Canal beta: versão de testes, sujeita a falhas.' }],
      progress: { label: 'Download', value: 'update.progress', limit: 'update.total' },
      message: 'update.message',
      actions: [
        { label: 'Verificar', path: '/update/check', disabled: 'update.checkDisabled', instruction: 'update.instruction' },
        { label: 'Baixar', path: '/update/download', disabled: 'update.downloadDisabled', instruction: 'update.instruction' },
        { label: 'Instalar e reiniciar', path: '/update/install', disabled: 'update.installDisabled', instruction: 'update.instruction' },
        { label: 'Tentar de novo', path: '/update/retry', disabled: 'update.retryDisabled', instruction: 'update.instruction' }
      ]
    }
  ]
};
const app: AppDef = {
  name: 'Exemplo de uso',
  entities: [],
  homePath: '/uso',
  pages: [{ path: '/uso', title: 'Uso e atualização', dashboard }],
  layout: { menu: [{ items: [{ title: 'Uso', path: '/uso' }] }] }
};
type State = 'checking' | 'available' | 'downloading' | 'ready' | 'error';
function Demo({ state, beta = false }: { state: State; beta?: boolean }) {
  useState(() => window.history.replaceState(null, '', '#/uso'));
  const transport = useMemo<C3Fetch>(() => {
    let current = state;
    return async (url, init) => {
      if (init?.method === 'POST') current = url.endsWith('/download') ? 'ready' : url.endsWith('/install') ? 'checking' : 'available';
      const data = {
        providers: [
          {
            name: 'Provedor A (exemplo)',
            input: 25000,
            output: 12000,
            limit: 100000,
            cost: 12.3,
            currency: 'BRL',
            start: '2026-11-01T12:00:00Z',
            end: '2026-11-30T12:00:00Z'
          },
          {
            name: 'Provedor B (exemplo)',
            input: 4000,
            output: 2000,
            limit: 20000,
            cost: 1.2,
            currency: 'USD',
            start: '2026-11-01T12:00:00Z',
            end: '2026-11-30T12:00:00Z'
          }
        ],
        agents: [
          { name: 'Atendimento', tokens: 30000, share: 75 },
          { name: 'Pesquisa', tokens: 10000, share: 25 }
        ],
        update: {
          state: current,
          current: '1.0.0',
          next: '1.1.0',
          channel: beta ? 'beta' : 'estável',
          progress: current === 'downloading' ? 45 : current === 'ready' ? 100 : 0,
          total: 100,
          message: current === 'error' ? 'Não foi possível baixar. Verifique a conexão e tente novamente.' : '',
          checkDisabled: current === 'checking' || current === 'downloading',
          downloadDisabled: current !== 'available',
          installDisabled: current !== 'ready',
          retryDisabled: current !== 'error',
          instruction: 'Esta ação fica disponível na etapa correspondente da atualização.'
        }
      };
      return new Response(JSON.stringify(url.endsWith('/_meta/app') ? { data: app } : data), {
        headers: { 'content-type': 'application/json' }
      });
    };
  }, [state, beta]);
  return <C3Shell apiUrl="/api" router="hash" transport={transport} />;
}
const meta = {
  title: 'Telas/Painel por resumo',
  component: Demo,
  parameters: { bare: true, router: false, docs: { source: { transform: () => JSON.stringify(app, null, 2) } } }
} satisfies Meta<typeof Demo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Disponivel: Story = { args: { state: 'available' } };
export const Verificando: Story = { args: { state: 'checking' } };
export const Baixando: Story = { args: { state: 'downloading' } };
export const Pronto: Story = { args: { state: 'ready' } };
export const Erro: Story = { args: { state: 'error' } };
export const Beta: Story = { args: { state: 'available', beta: true } };
