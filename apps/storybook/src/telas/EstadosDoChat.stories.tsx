import type { Meta, StoryObj } from '@storybook/react-vite';

import type { AppDef } from '@c3theme/engine';

import ShellJson, { type ShellJsonProps } from '../motor/ShellJson';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const refuse = (status: number, code: string) => json({ error: { code, message: `Erro ${status}.` } }, status);

const ANTIGA = {
  id: 'm1',
  conversationId: 'assistant',
  author: { id: 'bot', name: 'Assistente', kind: 'agent' },
  direction: 'in',
  text: 'Ontem você vendeu R$ 4.320,00 em 37 pedidos.',
  createdAt: '2026-11-11T18:00:00Z'
};

/** A conversa que abre: GET das mensagens com a resposta da história; o resto do /_chat fica sem rota. */
const chat =
  (messages: () => Promise<Response>): ShellJsonProps['api'] =>
  (url) =>
    url.includes('/_chat/assistant/messages') ? messages() : undefined;

const app: AppDef = {
  name: 'Loja Exemplo',
  entities: [],
  homePath: '/assistente',
  pages: [
    {
      path: '/assistente',
      title: 'Assistente',
      chat: {
        suggestions: ['Quanto vendi ontem?', 'Quais faturas vencem hoje?'],
        states: {
          loading: { message: 'Abrindo a conversa com o assistente…' },
          empty: {
            message: 'Nenhuma conversa ainda. Comece por uma pergunta ou veja quem são os agentes.',
            action: { label: 'Ver agentes', path: '/agentes' }
          },
          error: { message: 'O assistente não respondeu agora.', action: { label: 'Tentar de novo', retry: true } },
          forbidden: {
            message: 'Você ainda não pode usar o assistente.',
            instruction: 'Peça a quem administra a loja o papel "Agentes" em Configurações, Pessoas.',
            action: { label: 'Ver meus acessos', path: '/acessos' }
          },
          offline: {
            message: 'Sem conexão com o servidor.',
            works: ['O que já foi conversado continua aqui.', 'O texto que você escrever fica na caixa até voltar.']
          }
        }
      }
    }
  ],
  layout: { menu: [{ title: 'Loja', items: [{ title: 'Assistente', path: '/assistente', icon: 'Chart' }] }] }
} as AppDef;

/**
 * Os cinco estados da página de chat declarados na spec (`chat.states`, issue #101, ADR 0011): cada um com o texto e a
 * ação que a pessoa vê. O app.json é o mesmo nas cinco; muda só o que o /_chat responde. "Mostrar código" traz o JSON.
 */
const meta = {
  title: 'Telas/Estados do chat',
  component: ShellJson,
  argTypes: { app: { control: 'object' }, route: { control: false }, api: { control: false }, proxy503: { control: false } },
  args: { app, route: '/assistente' },
  parameters: {
    bare: true,
    router: false,
    docs: {
      source: { transform: (_: string, { args }: { args: { app: AppDef } }) => JSON.stringify(args.app, null, 2) },
      story: { inline: false, iframeHeight: 640 }
    }
  }
} satisfies Meta<typeof ShellJson>;

export default meta;
type Story = StoryObj<typeof meta>;

/** `states.loading`: o histórico ainda não chegou. */
export const Carregando: Story = { args: { api: chat(() => new Promise<Response>(() => {})) } };

/** `states.empty`: conversa sem mensagens, com a ação do próximo passo e as sugestões, que enviam. */
export const Vazio: Story = { args: { api: chat(async () => json({ messages: [], hasMore: false })) } };

/** `states.error`: 5xx ao abrir; "Tentar de novo" carrega o histórico outra vez. */
export const Erro: Story = { args: { api: chat(async () => refuse(500, 'internal')) } };

/** `states.forbidden`: 403 nas rotas /_chat cobre o painel com como conseguir a permissão. */
export const SemPermissao: Story = { name: 'Sem permissão', args: { api: chat(async () => refuse(403, 'forbidden')) } };

/** `states.offline`: o pedido nem chegou ao servidor; a lista diz o que continua funcionando. */
export const Offline: Story = { args: { api: chat(() => Promise.reject(new TypeError('Failed to fetch'))) } };

/** Com histórico, o erro e o offline vão numa faixa acima da conversa, que continua visível. Aqui: a primeira vez abre, as outras falham. */
export const ErroComHistorico: Story = {
  name: 'Erro com histórico',
  args: {
    api: (() => {
      let calls = 0;
      return chat(async () => (calls++ === 0 ? json({ messages: [ANTIGA], hasMore: true }) : refuse(502, 'bad_gateway')));
    })()
  }
};
