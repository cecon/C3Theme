import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import MotorField from '../motor/MotorField';
import { jsonSource } from '../motor/source';
import { withMotor } from '../motor/withMotor';

/** Pelo motor: `decimal` com `scale` (e `currency` para moeda) e `integer`. O valor trafega como texto com ponto. */
const meta = {
  title: 'Campos/Número e moeda',
  component: MotorField,
  decorators: [withMotor],
  parameters: { docs: { source: jsonSource } },
  args: { entity: 'produto', field: 'peso', value: '12.5', onChange: fn() }
} satisfies Meta<typeof MotorField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Decimal_: Story = { name: 'Decimal' };

export const Moeda: Story = { args: { field: 'preco', value: '1234.5' } };

export const Inteiro: Story = { args: { field: 'estoque', value: 40 } };

export const ComErro: Story = { name: 'Com erro', args: { field: 'preco', value: null, error: 'Informe o preço de venda.' } };

export const SoLeitura: Story = { name: 'Só leitura', args: { field: 'custo', value: '842.1' } };

export const ComAjuda: Story = { name: 'Com ajuda (hint)', args: { field: 'peso_bruto' } };
