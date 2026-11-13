import type { Meta, StoryObj } from '@storybook/react-vite';
import type { AppDef } from '@c3theme/engine';
import type { Message } from '@c3theme/chat';
import ShellJson, { type ShellJsonProps } from '../motor/ShellJson';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const app: AppDef = {
  layout: { menu: [] },
  name: 'Conversa',
  entities: [],
  homePath: '/conversa',
  pages: [
    {
      path: '/conversa',
      title: 'Conversa',
      chat: {
        pinned: { label: 'Mensagens fixadas' },
        messageActions: [
          { id: 'fixar', label: 'Fixar mensagem', when: { meta: { fixada: false } } },
          { id: 'desafixar', label: 'Desafixar mensagem', when: { meta: { fixada: true } } }
        ]
      }
    }
  ]
};
function api(mode: 'normal' | 'empty' | 'absent'): ShellJsonProps['api'] {
  const messages: Message[] = Array.from({ length: 65 }, (_, i) => ({
    id: `m${i}`,
    conversationId: 'assistant',
    direction: i % 2 ? 'out' : 'in',
    author: { id: i % 2 ? 'me' : 'bot', name: i % 2 ? 'Você' : 'Assistente' },
    text: i === 0 ? 'Primeira decisão da conversa' : `Mensagem ${i}`,
    createdAt: new Date(2026, 0, 1, 0, i).toISOString(),
    meta: { fixada: mode === 'normal' && (i === 0 || i === 64) }
  }));
  return (url, init) => {
    const path = new URL(url, 'http://story.local');
    if (path.pathname.endsWith('/_pinned'))
      return Promise.resolve(
        mode === 'absent'
          ? json({}, 404)
          : json({
              data: messages
                .filter((m) => m.meta?.fixada)
                .map((m) => ({
                  messageId: m.id,
                  author: m.author,
                  direction: m.direction,
                  text: m.text,
                  createdAt: m.createdAt,
                  pinnedAt: m.createdAt
                }))
            })
      );
    if (path.pathname.endsWith('/messages') && (!init?.method || init.method === 'GET')) {
      const end = path.searchParams.has('before') ? messages.findIndex((m) => m.id === path.searchParams.get('before')) : messages.length;
      const start = Math.max(0, end - Number(path.searchParams.get('limit') ?? 30));
      return Promise.resolve(json({ messages: messages.slice(start, end), hasMore: start > 0 }));
    }
    if (path.pathname.includes('/_actions/')) {
      const id = path.pathname.split('/messages/')[1]?.split('/')[0];
      const message = messages.find((m) => m.id === id);
      if (message) message.meta = { fixada: path.pathname.endsWith('/fixar') };
      return Promise.resolve(json({ message: 'Atualizado' }));
    }
    return undefined;
  };
}
const meta = {
  title: 'Telas/Mensagens fixadas',
  component: ShellJson,
  args: { app, route: '/conversa' },
  parameters: { bare: true, router: false }
} satisfies Meta<typeof ShellJson>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Historico: Story = { args: { api: api('normal') } };
export const Vazio: Story = { args: { api: api('empty') } };
export const SemRecurso: Story = { args: { api: api('absent') } };
