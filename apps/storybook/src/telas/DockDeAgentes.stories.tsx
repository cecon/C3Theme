import { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { C3Shell, type AgentDockPort, type AgentDockSnapshot, type AppDef, type C3Fetch, type DockAgent, useEngine } from '@c3theme/engine';
import { FillHeight } from '@c3theme/ui';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Stack from '@mui/material/Stack';
import type { AgentDockPosition } from '@c3theme/ui';

const items: DockAgent[] = [
  { id: 'design', label: 'Design', status: 'running', mark: 'D', path: '/design' },
  { id: 'dev', label: 'Desenvolvimento', status: 'waiting-approval', approvals: 2, path: '/dev' },
  { id: 'review', label: 'Revisão', status: 'done', path: '/review' }
];
function Conversation() {
  const [open, setOpen] = useState(false);
  const { agentDocks } = useEngine();
  const port = agentDocks!.agents as AgentDockPort & { publish(snapshot: AgentDockSnapshot): void };
  return (
    <FillHeight>
      <Stack spacing={2} sx={{ flex: 1, minHeight: 0 }}>
        <p>Conversa preservada enquanto os agentes trabalham.</p>
        <input aria-label="Rascunho" defaultValue="Minha próxima mensagem" />
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
          <Button onClick={() => port.publish({ items: [], offline: true })}>Ficar offline</Button>
          <Button onClick={() => port.publish({ items })}>Reconectar</Button>
          <Button onClick={() => setOpen(true)}>Abrir conversa lateral</Button>
        </Stack>
        <div data-testid="page-bottom" style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          A conversa ocupa apenas a área útil da janela.
        </div>
        <Drawer anchor="right" open={open} onClose={() => setOpen(false)} slotProps={{ paper: { sx: { width: 360, p: 2 } } }}>
          <p>Conversa lateral preservada</p>
          <input aria-label="Mensagem lateral" />
          <Button onClick={() => setOpen(false)}>Fechar conversa</Button>
        </Drawer>
      </Stack>
    </FillHeight>
  );
}
function Demo({
  position = 'bottom',
  scenario = 'ready'
}: {
  position?: AgentDockPosition;
  scenario?: 'ready' | 'loading' | 'empty' | 'error' | 'offline';
}) {
  useState(() => window.history.replaceState(null, '', '#/design'));
  const port = useMemo(() => {
    const listeners = new Set<() => void>();
    let snapshot: AgentDockSnapshot = {
      items: ['ready', 'offline'].includes(scenario) ? items : [],
      loading: scenario === 'loading',
      error: scenario === 'error',
      offline: scenario === 'offline'
    };
    const p = {
      getSnapshot: () => snapshot,
      subscribe(listener: () => void) {
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
        };
      },
      publish(next: AgentDockSnapshot) {
        snapshot = next;
        listeners.forEach((listener) => listener());
      },
      retry() {
        p.publish({ items });
      }
    };
    return p;
  }, [scenario]);
  const app: AppDef = {
    name: 'Equipe',
    entities: [],
    homePath: '/design',
    pages: ['/design', '/dev', '/review', '/novo'].map((path) => ({ path, component: 'Conversation' })),
    layout: {
      header: { search: false, settings: false, fullscreen: false },
      menu: [{ items: [{ title: 'Conversa', path: '/design' }] }],
      footer: null,
      agentDock: {
        source: 'agents',
        label: 'Agentes ativos',
        position,
        size: position === 'right' ? 190 : 88,
        states: { empty: { message: 'Nenhum agente ativo nesta equipe.', action: { label: 'Criar agente', path: '/novo' } } }
      }
    }
  };
  const transport: C3Fetch = async (input) => {
    if (String(input).endsWith('/_meta/app'))
      return new Response(JSON.stringify({ data: app }), { headers: { 'content-type': 'application/json' } });
    return new Response('{}', { status: 404 });
  };
  return (
    <C3Shell
      apiUrl="/dock-demo"
      transport={transport}
      router="hash"
      agentDocks={{ agents: port }}
      icons={{}}
      components={{ Conversation }}
    />
  );
}
const meta = {
  title: 'Telas/Dock de agentes',
  component: Demo,
  parameters: { layout: 'fullscreen', bare: true, router: false }
} satisfies Meta<typeof Demo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Inferior: Story = { args: { position: 'bottom' } };
export const Superior: Story = { args: { position: 'top' } };
export const Lateral: Story = { args: { position: 'right' } };
export const Carregando: Story = { args: { scenario: 'loading' } };
export const Vazio: Story = { args: { scenario: 'empty' } };
export const Erro: Story = { args: { scenario: 'error' } };
export const Offline: Story = { args: { scenario: 'offline' } };
