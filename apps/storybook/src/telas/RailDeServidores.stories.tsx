import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { C3Shell, type AppDef, type C3Fetch, type ShellRailsPort } from '@c3theme/engine';
import type { ServerRailItem } from '@c3theme/ui';

const app: AppDef = {
  name: 'Equipe',
  entities: [],
  homePath: '/agentes',
  pages: [
    { path: '/agentes', comingSoon: { message: 'Conteúdo preservado ao trocar de servidor.' } },
    { path: '/uso', comingSoon: { message: 'Uso da equipe.' } }
  ],
  layout: {
    orientation: 'vertical',
    header: { search: false, settings: false, fullscreen: false },
    menu: [
      {
        items: [
          { title: 'Agentes', path: '/agentes' },
          { title: 'Uso', path: '/uso' }
        ]
      }
    ],
    rails: { servers: { shortcuts: true, localServerId: 'local' }, pages: { defaultPinned: ['agentes'] } }
  }
};
const list: ServerRailItem[] = [
  { id: 'local', name: 'Este computador', state: 'online' },
  { id: 'remote', name: 'Equipe', state: 'online' },
  { id: 'sleep', name: 'Arquivo', state: 'waking' },
  { id: 'old', name: 'Servidor antigo', state: 'incompatible', detail: 'Atualize o servidor para conectar.' }
];
const transport: C3Fetch = async () => new Response(JSON.stringify({ data: app }), { headers: { 'content-type': 'application/json' } });
type Scenario = 'ready' | 'loading' | 'empty' | 'error' | 'long';
function Demo({ scenario = 'ready' }: { scenario?: Scenario }) {
  const [active, setActive] = useState('local');
  const [error, setError] = useState(scenario === 'error');
  const [action, setAction] = useState('');
  const items =
    scenario === 'empty'
      ? []
      : scenario === 'long'
        ? [...list, ...Array.from({ length: 30 }, (_, i): ServerRailItem => ({ id: `s${i}`, name: `Servidor ${i}`, state: 'offline' }))]
        : list;
  const rails: ShellRailsPort = {
    servers: {
      servers: items,
      activeId: active,
      state: error ? 'error' : scenario === 'loading' ? 'loading' : 'ready',
      errorMessage: 'Não foi possível consultar a conta.',
      storageKey: `demo-servidores-${scenario}`,
      onSelect: setActive,
      onRetry: () => setError(false),
      addOptions: [{ id: 'remote', label: 'Servidor remoto' }],
      onAdd: (id) => setAction(`Adicionar: ${id}`),
      actions: () => [{ id: 'settings', label: 'Configurações do servidor' }],
      onAction: (id, verb) => setAction(`${verb}: ${id}`)
    }
  };
  return (
    <>
      <C3Shell apiUrl="/demo" transport={transport} router="hash" icons={{}} rails={rails} />
      <output aria-live="polite" style={{ position: 'fixed', bottom: 8, right: 8 }}>
        {action}
      </output>
    </>
  );
}
const meta = {
  title: 'Telas/Rail de servidores',
  component: Demo,
  parameters: { bare: true, router: false, layout: 'fullscreen' }
} satisfies Meta<typeof Demo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Completo: Story = { args: { scenario: 'ready' } };
export const Carregando: Story = { args: { scenario: 'loading' } };
export const Vazio: Story = { args: { scenario: 'empty' } };
export const Erro: Story = { args: { scenario: 'error' } };
export const ListaLonga: Story = { args: { scenario: 'long' } };
