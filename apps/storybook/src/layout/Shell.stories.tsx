import type { Meta, StoryObj } from '@storybook/react-vite';

import MotorShell from '../motor/MotorShell';
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
