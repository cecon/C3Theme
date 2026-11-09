import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { SearchSelectField } from '@c3theme/ui';
import MotorField from '../motor/MotorField';
import { jsonSource } from '../motor/source';
import { withMotor } from '../motor/withMotor';

/** Uso direto: a spec não tem reference com vários valores. */
function Many() {
  const [value, setValue] = useState<number[]>([1, 4]);
  const options = ['Ana Souza', 'Bruno Lima', 'Carla Mendes', 'Diego Araújo'].map((label, i) => ({ value: i + 1, label }));
  return <SearchSelectField multiple label="Responsáveis" options={options} value={value} onChange={setValue} sx={{ maxWidth: 480 }} />;
}

/**
 * Pelo motor: `reference` busca pelo `titleField` da entidade apontada, sem diferenciar acento e maiúscula. Quem pode
 * criar registros dela ganha o "Cadastrar", que abre o formulário num diálogo com o texto digitado.
 */
const meta = {
  title: 'Campos/Busca (lookup)',
  component: MotorField,
  decorators: [withMotor],
  parameters: { docs: { source: jsonSource } },
  args: { entity: 'fatura', field: 'cliente', value: { id: '3', title: 'Carla Mendes' }, onChange: fn() }
} satisfies Meta<typeof MotorField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ComCadastro: Story = { name: 'Um valor, com "cadastrar"' };

/** O vendedor não tem `create` nas capabilities: a busca não oferece cadastrar. */
export const SemCadastro: Story = { name: 'Sem permissão de cadastrar', args: { field: 'vendedor', value: null } };

export const ComErro: Story = { name: 'Com erro', args: { value: null, error: 'Escolha o cliente.' } };

export const Varios: Story = { name: 'Vários valores (uso direto)', tags: ['uso-direto'], render: () => <Many /> };
