import type { Meta, StoryObj } from '@storybook/react-vite';
import type { AppDef } from '@c3theme/engine';
import type { Message } from '@c3theme/chat';
import ShellJson, { type ShellJsonProps } from '../motor/ShellJson';

// Faixa de abas das threads (#134): tudo pela spec (`chat.tabs`); o app só responde as rotas de chat-lanes.yaml.
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const app: AppDef = {
  layout: { menu: [] },
  name: 'Abas',
  entities: [],
  homePath: '/conversa',
  pages: [
    {
      path: '/conversa',
      title: 'Conversa',
      chat: {
        title: 'Agente',
        lanes: {},
        tabs: { main: 'Principal', shortcuts: { next: 'Ctrl+Alt+Right', previous: 'Ctrl+Alt+Left', new: 'Alt+T', close: 'Alt+W' } }
      }
    }
  ]
};
const at = (m: number) => new Date(2026, 10, 17, 9, m).toISOString();
const say = (conversationId: string, id: string, text: string, m: number): Message => ({
  id,
  conversationId,
  direction: 'in',
  author: { id: 'bot', name: 'Agente', kind: 'agent' },
  text,
  createdAt: at(m)
});
type Mode = 'normal' | 'many' | 'error' | 'empty';
function api(mode: Mode): ShellJsonProps['api'] {
  const base = [
    { id: 'pesquisa', title: 'Pesquisa de preços', working: true },
    { id: 'contrato', title: 'Revisão do contrato', attention: 'approval' },
    { id: 'resumo', title: 'Resumo da semana', unread: 2 },
    { id: 'deploy', title: 'Publicar versão', failed: true },
    { id: 'antiga', title: 'Thread antiga', unavailable: 'Arquivada em outro aparelho' }
  ];
  const extra = Array.from({ length: 8 }, (_, i) => ({ id: `extra${i}`, title: `Investigação ${i + 1}` }));
  const lanes = (mode === 'empty' ? [] : mode === 'many' ? [...base, ...extra] : base).map((l, i) => ({
    kind: 'aside',
    parentId: 'assistant',
    unread: 0,
    updatedAt: at(i),
    ...l
  }));
  const messages: Record<string, Message[]> = {
    assistant: [say('assistant', 'm1', 'Oi! Abra uma thread ao lado para pesquisar sem parar esta conversa.', 0)],
    ...Object.fromEntries(lanes.map((l) => [l.id, [say(l.id, `${l.id}-1`, `Conversa de ${l.title}.`, 1)]]))
  };
  return (url, init) => {
    const path = new URL(url, 'http://story.local').pathname;
    if (path.endsWith('/_lanes')) {
      if (mode === 'error') return Promise.resolve(json({ error: { code: 'internal', message: 'Não deu para abrir as threads.' } }, 500));
      if (init?.method === 'POST') {
        const body = JSON.parse(String(init.body ?? '{}')) as { text?: string };
        const lane = {
          id: `nova${lanes.length}`,
          kind: 'aside',
          parentId: 'assistant',
          unread: 0,
          updatedAt: at(30),
          title: body.text ?? 'Thread nova'
        };
        lanes.push(lane);
        messages[lane.id] = [];
        return Promise.resolve(json({ data: lane }, 201));
      }
      return Promise.resolve(json({ data: lanes }));
    }
    const conversation = /\/_chat\/([^/]+)\/messages$/.exec(path)?.[1];
    if (conversation && (!init?.method || init.method === 'GET'))
      return Promise.resolve(json({ messages: messages[decodeURIComponent(conversation)] ?? [], hasMore: false }));
    return undefined;
  };
}
const meta = {
  title: 'Telas/Abas das threads',
  component: ShellJson,
  args: { app, route: '/conversa' },
  parameters: {
    bare: true,
    router: false,
    docs: {
      description: {
        component:
          'Faixa de abas no alto do painel central, declarada em `chat.tabs` (#134, ADR 0016). Abra uma thread pela lista "Todas as abas" ou pelo "+"; arraste, renomeie (F2), feche (Delete, com desfazer) e troque pelas setas ou pelos atalhos declarados.'
      }
    }
  }
} satisfies Meta<typeof ShellJson>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Completa: Story = { args: { api: api('normal') } };
export const MuitasAbas: Story = { args: { api: api('many') } };
export const SoAPrincipal: Story = { args: { api: api('empty') } };
export const ErroAoCarregar: Story = { args: { api: api('error') } };
