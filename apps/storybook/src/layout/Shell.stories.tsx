import type { Meta, StoryObj } from '@storybook/react-vite';

import MotorShell from '../motor/MotorShell';
import { searchFor } from '../motor/play';
import { appSource } from '../motor/source';
import { withMotor } from '../motor/withMotor';

/**
 * A shell pelo `app.json`: grupos e itens do menu (`layout.menu`, com ícone, filhos e contador do preset), botões do
 * cabeçalho (`layout.header`), rodapé e a tela da entidade da rota. A aba Code mostra o app.json.
 *
 * Lacunas (uso direto em "Layout/AppLayout" e "Layout/Cabeçalho"): o menu do usuário só aparece com a sessão do `auth`,
 * e `layout.header.languages` e `userMenu` estão na spec mas a shell ainda não desenha.
 */
const meta = {
  title: 'Layout/Shell pelo motor',
  component: MotorShell,
  decorators: [withMotor],
  args: { orientation: 'vertical' },
  argTypes: { orientation: { control: 'inline-radio', options: ['vertical', 'horizontal', 'rail'] } },
  parameters: { bare: true, route: '/fatura', docs: { source: appSource, story: { inline: false, iframeHeight: 620 } } }
} satisfies Meta<typeof MotorShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MenuVertical: Story = { name: 'Menu vertical' };

export const MenuHorizontal: Story = { name: 'Menu horizontal', args: { orientation: 'horizontal' } };

/** Ícones dos grupos numa faixa e o painel com os itens do grupo aberto. */
export const DoisNiveis: Story = { name: 'Dois níveis', args: { orientation: 'rail' } };

export const RegistroAberto: Story = { name: 'Registro aberto', parameters: { route: '/cliente/2' } };

/** `layout.header.search: { records: true }`: o Ctrl K acha telas e também registros pelo GET /_search, agrupados. */
export const BuscaCtrlK: Story = { name: 'Busca do Ctrl K', play: searchFor('ana') };

/**
 * Consulta do sistema com `columns[].href`: a linha não abre sozinha, mas o produto é link para o kardex dele,
 * montado pelos campos da linha (`/movimento?f.produto={produto}`), sem ida ao servidor.
 */
export const PosicaoParaKardex: Story = { name: 'Posição de estoque, link para o kardex', parameters: { route: '/posicao_estoque' } };

/**
 * Agenda da semana (`views.calendar` com `range: "week"` e `slot: "hour"`): uma coluna por dia, uma linha por hora, cada
 * pedido na hora da entrega. A cor vem da situação (`map`) e a regra do atrasado vence o mapa (vermelho). É uma visão só
 * de leitura: não arrasta nem cria. O clique leva à entrega (`open.href`).
 */
export const AgendaSemana: Story = { name: 'Controle semanal, agenda da semana', parameters: { route: '/agenda_entrega/calendar' } };
