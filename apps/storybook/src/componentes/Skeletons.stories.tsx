import type { Meta, StoryObj } from '@storybook/react-vite';

import { PanelSkeleton } from '@c3theme/ui';
import MotorScreen from '../motor/MotorScreen';
import { jsonSource } from '../motor/source';
import { withMotor } from '../motor/withMotor';

/**
 * Pelo motor: enquanto os registros não chegam, a lista e o formulário desenham o esqueleto no formato da spec
 * (colunas da lista, seções e campos do formulário). Na tela real ele só aparece depois de 200 ms.
 */
const meta = {
  title: 'Componentes/Carregando',
  component: MotorScreen,
  decorators: [withMotor],
  parameters: { docs: { source: jsonSource }, motor: { loading: true } },
  args: { entity: 'fatura', screen: 'form', id: '1' },
  argTypes: { screen: { control: false }, id: { control: false } }
} satisfies Meta<typeof MotorScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Formulario: Story = { name: 'Formulário' };

export const LinhasDeTabela: Story = { name: 'Linhas de tabela', args: { screen: 'list', id: undefined } };

/** Uso direto: cartão genérico, para bloco próprio do sistema. */
export const Cartao: Story = { name: 'Cartão (uso direto)', tags: ['uso-direto'], render: () => <PanelSkeleton delay={0} lines={4} /> };

/** Com `label`: o que o leitor de tela anuncia no lugar de "Carregando…" (é o `states.loading.text` da página). */
export const CartaoComTexto: Story = {
  name: 'Cartão com o que carrega (uso direto)',
  tags: ['uso-direto'],
  render: () => <PanelSkeleton delay={0} lines={4} label="Carregando as faturas do mês" />
};
