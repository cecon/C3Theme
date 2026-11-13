import { createContext, useContext, useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import {
  ChatPanel,
  C3Shell,
  type AgentDockPort,
  type AppDef,
  type AuthPort,
  type C3Fetch,
  type ShellRailsPort,
  type SidebarPort
} from '@c3theme/engine';
import { FillHeight } from '@c3theme/ui';
import type { Message } from '@c3theme/chat';

const UpdateContext = createContext(() => {});
function UpdateControl() {
  const update = useContext(UpdateContext);
  return (
    <Button size="small" onClick={update}>
      Atualizar estados
    </Button>
  );
}
function Conversation() {
  return (
    <FillHeight>
      <Box data-testid="integrated-page" sx={{ flex: 1, minHeight: 0, minWidth: 0 }}>
        <ChatPanel def={{ title: 'Conversa principal', pinned: { label: 'Mensagens fixadas' } }} />
      </Box>
    </FillHeight>
  );
}
const app: AppDef = {
  name: 'Equipe integrada',
  entities: [],
  homePath: '/conversa',
  pages: [
    { path: '/conversa', component: 'Conversation', title: 'Conversa' },
    { path: '/uso', comingSoon: { message: 'Uso da equipe' } }
  ],
  layout: {
    user: 'drawer',
    rails: { servers: { shortcuts: true }, pages: { defaultPinned: ['/conversa'] } },
    menu: [
      {
        items: [
          { title: 'Conversa', path: '/conversa' },
          { title: 'Uso', path: '/uso' }
        ]
      }
    ],
    sidebar: { source: 'team', title: 'Equipe', label: 'Conversas da equipe', sections: [{ id: 'team', label: 'Pessoas' }] },
    agentDock: { source: 'agents', position: 'right', size: 160, label: 'Agentes ativos' },
    header: { search: false, settings: false, fullscreen: false, actions: ['UpdateControl'], assistant: { title: 'Conversa lateral' } },
    footer: null
  }
};
const messages: Message[] = [
  {
    id: 'm1',
    conversationId: 'assistant',
    direction: 'in',
    author: { id: 'bot', name: 'Assistente' },
    text: 'Decisão integrada preservada',
    createdAt: '2026-11-12T12:00:00Z',
    meta: { fixada: true }
  }
];
const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } });
const auth: AuthPort = {
  me: async () => ({ id: 'ana', name: 'Ana' }),
  login: async () => ({ token: 'demo', user: { id: 'ana', name: 'Ana' } })
};
const transport: C3Fetch = async (url) => {
  const path = new URL(url, 'http://story.local').pathname;
  if (path.endsWith('/_meta/login')) return json({ data: { name: app.name, auth: { profile: false } } });
  if (path.endsWith('/_meta/app')) return json({ data: app });
  if (path.endsWith('/messages')) return json({ messages, hasMore: false });
  if (path.endsWith('/_pinned'))
    return json({
      data: messages.map((m) => ({
        messageId: m.id,
        author: m.author,
        direction: m.direction,
        text: m.text,
        createdAt: m.createdAt,
        pinnedAt: m.createdAt
      }))
    });
  return json({}, 404);
};
const components = { Conversation, UpdateControl };
const noopSubscribe = () => () => {};
function Demo() {
  useState(() => {
    window.history.replaceState(null, '', '#/conversa');
    localStorage.setItem('c3.token', 'integrated-demo');
  });
  const [server, setServer] = useState('a');
  const [tick, setTick] = useState(0);
  const sidebar = useMemo(() => {
    const snapshot = {
      serverId: server,
      items: [{ id: 'ana', section: 'team', label: 'Ana', path: '/conversa', status: tick ? 'Respondeu' : 'Trabalhando' }]
    };
    return { getSnapshot: () => snapshot, subscribe: noopSubscribe } satisfies SidebarPort;
  }, [server, tick]);
  const dock = useMemo(() => {
    const snapshot = {
      items: [{ id: 'design', label: 'Design', status: tick ? ('done' as const) : ('running' as const), path: '/conversa', mark: 'D' }]
    };
    return { getSnapshot: () => snapshot, subscribe: noopSubscribe, retry: () => {} } satisfies AgentDockPort;
  }, [tick]);
  const rails: ShellRailsPort = {
    servers: {
      servers: [
        { id: 'a', name: 'Servidor A', state: 'online' },
        { id: 'b', name: 'Servidor B', state: 'online' }
      ],
      activeId: server,
      onSelect: setServer,
      storageKey: 'integrated-servers'
    },
    pages: { storageKey: 'integrated-pages' }
  };
  return (
    <UpdateContext.Provider value={() => setTick((value) => value + 1)}>
      <C3Shell
        apiUrl="/integrated"
        router="hash"
        auth={auth}
        transport={transport}
        rails={rails}
        sidebars={{ team: sidebar }}
        agentDocks={{ agents: dock }}
        components={components}
        icons={{}}
        theme={{ storageKey: 'integrated-theme' }}
      />
    </UpdateContext.Provider>
  );
}
const meta = { title: 'Telas/Casca integrada', component: Demo, parameters: { bare: true, router: false } } satisfies Meta<typeof Demo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Completa: Story = {};
