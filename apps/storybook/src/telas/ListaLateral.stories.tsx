import { useMemo } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { C3Shell, type AppDef, type C3Fetch, type SidebarPort, type SidebarSnapshot } from '@c3theme/engine';

const app: AppDef = {
  name: 'Equipe',
  entities: [],
  homePath: '/agentes',
  layout: {
    header: { search: false, settings: false, fullscreen: false },
    menu: [
      {
        items: [
          { title: 'Agentes', path: '/agentes' },
          { title: 'Conversa', path: '/conversa' }
        ]
      }
    ],
    sidebar: {
      source: 'equipe',
      label: 'Conversas da equipe',
      title: 'Agentes',
      sections: [
        { id: 'team', label: 'Time' },
        { id: 'routine', label: 'Rotinas' }
      ],
      cards: [
        { id: 'computer', label: 'Esta máquina', action: { id: 'open', label: 'Ver máquina' } },
        { id: 'update', label: 'Atualização disponível', dismissible: true, action: { id: 'update', label: 'Atualizar' } },
        { id: 'disk', label: 'Armazenamento crítico', dismissible: true, action: { id: 'storage', label: 'Liberar espaço' } }
      ]
    }
  },
  pages: [
    { path: '/agentes', comingSoon: { message: 'Escolha uma conversa na lista.' } },
    { path: '/conversa', comingSoon: { message: 'Conversa selecionada sem recarregar a janela.' } }
  ]
};
type Scenario = 'ready' | 'loading' | 'empty' | 'error' | 'alert' | 'hidden';
function Demo({ scenario = 'ready' }: { scenario?: Scenario }) {
  const sidebar = useMemo(() => {
    let snapshot: SidebarSnapshot = {
      serverId: 'demo-storybook',
      loading: scenario === 'loading',
      error: scenario === 'error' ? 'Não foi possível carregar a equipe.' : undefined,
      items:
        scenario === 'empty'
          ? []
          : [
              {
                id: 'ana',
                label: 'Ana',
                section: 'team',
                status: 'Trabalhando',
                pending: 2,
                path: '/conversa',
                actions: [{ id: 'duplicate', label: 'Duplicar' }]
              },
              { id: 'bia', label: 'Bia', section: 'team', status: 'Respondeu', path: '/conversa' },
              { id: 'rotina', label: 'Resumo diário', section: 'routine', status: 'Aguardando', path: '/conversa' }
            ],
      views: [
        { id: 'agents', label: 'Agentes' },
        { id: 'routines', label: 'Rotinas' }
      ],
      view: 'agents',
      cards:
        scenario === 'alert'
          ? [
              { id: 'disk', severity: 'critical' },
              { id: 'update', severity: 'warning' }
            ]
          : [{ id: 'computer', severity: 'ok' }]
    };
    const listeners = new Set<() => void>();
    const update = (next: Partial<SidebarSnapshot>) => {
      snapshot = { ...snapshot, ...next };
      listeners.forEach((fn) => fn());
    };
    return {
      getSnapshot: () => snapshot,
      subscribe: (fn: () => void) => {
        listeners.add(fn);
        return () => {
          listeners.delete(fn);
        };
      },
      select: (id) => update({ active: id }),
      setView: (id) => update({ view: id }),
      retry: () => update({ error: undefined, loading: false }),
      action: (id) =>
        update({ items: [...snapshot.items, { ...snapshot.items.find((i) => i.id === id)!, id: `${id}-copy`, label: 'Cópia' }] })
    } satisfies SidebarPort;
  }, [scenario]);
  const transport: C3Fetch = async () =>
    new Response(
      JSON.stringify({ data: { ...app, layout: { ...app.layout, sidebar: { ...app.layout.sidebar!, hidden: scenario === 'hidden' } } } }),
      { headers: { 'content-type': 'application/json' } }
    );
  return <C3Shell apiUrl="/demo" transport={transport} sidebars={{ equipe: sidebar }} router="hash" />;
}
const meta = { title: 'Telas/Lista lateral por servidor', component: Demo, parameters: { bare: true, router: false } } satisfies Meta<
  typeof Demo
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Completa: Story = { args: { scenario: 'ready' } };
export const Carregando: Story = { args: { scenario: 'loading' } };
export const Vazia: Story = { args: { scenario: 'empty' } };
export const Erro: Story = { args: { scenario: 'error' } };
export const Alerta: Story = { args: { scenario: 'alert' } };
export const Oculta: Story = { args: { scenario: 'hidden' } };
