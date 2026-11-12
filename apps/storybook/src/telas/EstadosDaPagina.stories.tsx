import type { Meta, StoryObj } from '@storybook/react-vite';

import type { AppDef, StatesDef } from '@c3theme/engine';

import ShellJson from '../motor/ShellJson';

const states: StatesDef = {
  loading: { text: 'Carregando as vendas do dia' },
  empty: {
    text: 'Nenhuma venda hoje. Abra o caixa para começar.',
    action: { label: 'Ver relatórios', path: '/relatorios', icon: 'Chart' }
  },
  error: { text: 'Não deu para ler as vendas do caixa.', retry: 'Ler de novo' },
  forbidden: { text: 'Você não vê o caixa desta loja.', howTo: 'Peça ao gerente o perfil Caixa em Configurações › Usuários.' },
  offline: {
    text: 'Sem conexão com a loja. As vendas na tela podem estar desatualizadas.',
    keeps: ['Ver as vendas já abertas', 'Imprimir o último cupom']
  }
};

const app = (page: Record<string, unknown> = {}): AppDef =>
  ({
    name: 'Loja Exemplo',
    // sem entidade para a shell carregar: a história só responde a contagem da `statesEntity`
    entities: [],
    homePath: '/caixa',
    pages: [
      { path: '/caixa', title: 'Caixa', component: 'Caixa', statesEntity: 'venda', states, ...page },
      { path: '/relatorios', title: 'Relatórios', comingSoon: { message: 'Os relatórios chegam em dezembro.' } }
    ],
    layout: {
      menu: [
        {
          title: 'Loja',
          items: [
            { title: 'Caixa', path: '/caixa', icon: 'Wallet' },
            { title: 'Relatórios', path: '/relatorios', icon: 'Chart' }
          ]
        }
      ]
    }
  }) as AppDef;

/**
 * Os cinco estados de uma página que busca dado, todos do app.json (`pages[].states`, issue #99, ADR 0011). A shell
 * conta os registros da `statesEntity` antes de desenhar a página: carregando, vazio (com o próximo passo), erro (com
 * "Tentar de novo"), sem permissão (com como conseguir) e offline (com o que continua funcionando). "Mostrar código"
 * traz o app.json da história.
 */
const meta = {
  title: 'Telas/Estados da página',
  component: ShellJson,
  argTypes: { app: { control: 'object' }, route: { control: false }, count: { control: false }, online: { control: 'boolean' } },
  args: { route: '/caixa' },
  parameters: {
    bare: true,
    router: false,
    docs: {
      source: { transform: (_: string, { args }: { args: { app: AppDef } }) => JSON.stringify(args.app, null, 2) },
      story: { inline: false, iframeHeight: 560 }
    }
  }
} satisfies Meta<typeof ShellJson>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Com registro: a página de sempre. */
export const ComDados: Story = { name: 'Com dados', args: { app: app(), count: 12 } };

/** `states.empty`: nenhum registro na `statesEntity`, o recado e a ação do próximo passo. */
export const Vazio: Story = { args: { app: app(), count: 0 } };

/** `states.error`: a contagem falhou; o botão conta de novo. */
export const Erro: Story = { args: { app: app(), count: { status: 500 } } };

/** `states.forbidden`: a página negada no GET /_meta/app (ou 403 na contagem), com como conseguir a permissão. */
export const SemPermissao: Story = { name: 'Sem permissão', args: { app: app({ permission: 'negada' }), count: 12 } };

/** `states.offline`: a porta de conexão diz que caiu; o aviso fica no alto e a página continua com o que já carregou. */
export const Offline: Story = { args: { app: app(), count: 12, online: false } };

/** `states.loading`: enquanto a contagem não chega (aqui ela nunca chega), o que está carregando acima do esqueleto. */
export const Carregando: Story = { args: { app: app(), count: 'pending' } };

/** Sem rede de verdade (o pedido não chega ao servidor, como no Electron com o backend fora): o mesmo offline. */
export const SemRede: Story = { name: 'Sem rede (pedido falhou)', args: { app: app(), count: 'network' } };
