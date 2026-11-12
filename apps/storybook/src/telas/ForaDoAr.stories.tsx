import type { Meta, StoryObj } from '@storybook/react-vite';

import type { AppDef } from '@c3theme/engine';

import ShellJson from '../motor/ShellJson';

/** Daqui a 12 dias, ao meio-dia: a contagem e a previsão sempre no futuro. */
const soon = (days: number) => {
  const d = new Date(Date.now() + days * 86_400_000);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
};

const base = (extra: Partial<AppDef> = {}): AppDef =>
  ({
    name: 'Loja Exemplo',
    entities: [],
    homePath: '/relatorios',
    pages: [
      { path: '/relatorios', title: 'Relatórios', comingSoon: { message: 'Os relatórios de venda chegam em dezembro.', until: soon(12) } },
      { path: '/caixa', title: 'Caixa', component: 'Quebra' }
    ],
    layout: {
      menu: [
        {
          title: 'Loja',
          items: [
            { title: 'Relatórios', path: '/relatorios', icon: 'Chart' },
            { title: 'Caixa', path: '/caixa', icon: 'Wallet' }
          ]
        }
      ]
    },
    ...extra
  }) as AppDef;

/**
 * O que a shell monta sozinha quando o sistema sai do ar ou quebra (issue #81, ADR 0007). Tudo vem do app.json:
 * `status` (manutenção ou lançamento), `pages[].comingSoon` e as telas de erro, que não se declaram. "Mostrar código"
 * traz o app.json da história.
 */
const meta = {
  title: 'Telas/Fora do ar e erros',
  component: ShellJson,
  argTypes: { app: { control: 'object' }, route: { control: false }, proxy503: { control: false } },
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

/** `status.mode: "maintenance"`: o sistema inteiro dá lugar à tela, com a previsão de retorno e "Tentar de novo". A API continua aberta. */
export const Manutencao: Story = {
  name: 'Em manutenção',
  args: { app: base({ status: { mode: 'maintenance', message: 'Estamos trocando o servidor do banco.', until: soon(1) } }) }
};

/** `status.mode: "comingSoon"`: o lançamento com data, com a contagem; ao zerar, a shell pergunta de novo. */
export const EmBreve: Story = {
  name: 'Em breve (sistema inteiro)',
  args: { app: base({ status: { mode: 'comingSoon', title: 'A loja abre em breve', message: 'Falta pouco.', until: soon(12) } }) }
};

/** Sem mexer no app.json: o proxy responde 503 com `Retry-After` e a shell mostra a manutenção com a previsão. */
export const Proxy: Story = { name: 'Proxy fora do ar (503)', args: { app: base(), proxy503: '1800' } };

/** `pages[].comingSoon`: a tela ainda não pronta fica no menu e mostra "Em breve" dentro do layout. */
export const PaginaEmBreve: Story = { name: 'Página em breve', args: { app: base(), route: '/relatorios' } };

/** Uma tela que quebra: o 500 fica no meio do layout e o menu continua (abra "Relatórios" para sair). */
export const Erro500: Story = { name: 'Tela que quebra (500)', args: { app: base(), route: '/caixa' } };

/** Rota que não existe: o 404 com "Voltar ao início". */
export const NaoEncontrada: Story = { name: 'Rota que não existe (404)', args: { app: base(), route: '/nada' } };
