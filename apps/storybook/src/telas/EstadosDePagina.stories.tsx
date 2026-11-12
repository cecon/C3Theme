import { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import useSWR from 'swr';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { C3Shell, useEngine, usePageState, type AppDef, type C3Fetch, type ConnectivityPort, type PageStates } from '@c3theme/engine';

const states: PageStates = {
  loading: { message: 'Carregando pedidos da loja…' },
  empty: { message: 'Ainda não há pedidos.', action: { label: 'Criar o primeiro pedido', path: '/novo' } },
  error: { message: 'Não foi possível consultar os pedidos.', action: { label: 'Tentar de novo', retry: true } },
  forbidden: { message: 'Você não tem acesso aos pedidos.', instruction: 'Peça à administração a permissão pedidos.consultar.' },
  offline: { message: 'Sem conexão com a loja.', works: ['Consultar os pedidos já carregados', 'Editar o rascunho local'] }
};
const app: AppDef = {
  name: 'Loja',
  entities: [],
  homePath: '/dados',
  pages: [
    { path: '/dados', component: 'Pedidos', title: 'Pedidos', states },
    { path: '/novo', component: 'Novo' }
  ],
  layout: { menu: [{ items: [{ title: 'Pedidos', path: '/dados' }] }] }
};
function Pedidos() {
  const { client } = useEngine();
  const { data, error, isLoading, mutate } = useSWR('pedidos-da-pagina', () => client.list('pedido'), { shouldRetryOnError: false });
  usePageState({ loading: isLoading, empty: data?.data.length === 0, error, hasData: !!data?.data.length, retry: () => mutate() });
  return (
    <Stack spacing={2}>
      <p>{data?.data.map((row) => String(row.nome)).join(', ')}</p>
      <input aria-label="Rascunho" defaultValue="Anotação local preservada" />
    </Stack>
  );
}
const components = { Pedidos, Novo: () => <p>Novo pedido</p> };
type Scenario = 'loading' | 'empty' | 'error' | 'forbidden' | 'offline';
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

function Demo({ scenario }: { scenario: Scenario }) {
  useState(() => window.history.replaceState(null, '', '#/dados'));
  const [offline, setOffline] = useState(scenario === 'offline');
  const port = useMemo(() => {
    let online = scenario !== 'offline';
    const listeners = new Set<() => void>();
    return {
      getOnline: () => online,
      subscribe: (listener: () => void) => {
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
        };
      },
      setOnline(value: boolean) {
        online = value;
        for (const listener of listeners) listener();
      }
    } satisfies ConnectivityPort & { setOnline(value: boolean): void };
  }, [scenario]);
  const transport = useMemo<C3Fetch>(() => {
    let calls = 0;
    return async (url) => {
      if (url.endsWith('/_meta/app')) return json({ data: app, pages: { '/dados': scenario !== 'forbidden' } });
      if (scenario === 'loading') return new Promise<Response>(() => {});
      if (scenario === 'error' && calls++ === 0) return json({ error: { code: 'unexpected', message: 'Falha do serviço' } }, 500);
      return json({ data: scenario === 'empty' ? [] : [{ id: '1', nome: 'Pedido 1234' }], meta: { total: scenario === 'empty' ? 0 : 1 } });
    };
  }, [scenario]);
  return (
    <>
      <Button
        onClick={() => {
          port.setOnline(offline);
          setOffline(!offline);
        }}
      >
        {offline ? 'Restabelecer conexão' : 'Simular perda da conexão'}
      </Button>
      <C3Shell apiUrl="/api" router="hash" transport={transport} connectivity={port} components={components} />
    </>
  );
}
const meta = {
  title: 'Telas/Estados declarados da página',
  component: Demo,
  parameters: { bare: true, router: false, docs: { source: { transform: () => JSON.stringify(app, null, 2) } } }
} satisfies Meta<typeof Demo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Carregando: Story = { args: { scenario: 'loading' } };
export const Vazio: Story = { args: { scenario: 'empty' } };
export const Erro: Story = { args: { scenario: 'error' } };
export const SemPermissao: Story = { args: { scenario: 'forbidden' } };
export const Offline: Story = { args: { scenario: 'offline' } };
