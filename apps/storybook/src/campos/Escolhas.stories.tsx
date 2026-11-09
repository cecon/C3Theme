import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { RadioField, SelectField } from '@c3theme/ui';
import MotorField from '../motor/MotorField';
import { jsonSource } from '../motor/source';
import { withMotor } from '../motor/withMotor';
import { stateful } from '../support/stateful';

const Select = stateful(SelectField<string>);
const Radio = stateful(RadioField<string>);

const UFS = [
  { value: 'SP', label: 'São Paulo' },
  { value: 'RJ', label: 'Rio de Janeiro' }
];

/** Pelo motor: `enum` vira seleção e `flags` (soma dos bits num número só) vira marcações. */
const meta = {
  title: 'Campos/Seleção',
  component: MotorField,
  decorators: [withMotor],
  parameters: { docs: { source: jsonSource } },
  args: { entity: 'loja', field: 'uf', value: 'SP', onChange: fn() }
} satisfies Meta<typeof MotorField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Selecao: Story = { name: 'Seleção' };

export const SemValor: Story = { name: 'Sem valor', args: { value: null } };

/** Vários marcados num número só: dias da semana, canais. */
export const Marcacoes: Story = { name: 'Marcações (flags)', args: { field: 'dias_entrega', value: 2 | 8 | 32 } };

/** Uso direto: a spec não escolhe a seleção nativa; o motor sempre desenha a do tema. */
export const Nativa: Story = {
  name: 'Nativa (uso direto)',
  tags: ['uso-direto'],
  render: () => <Select label="Estado" value="SP" options={UFS} native onChange={fn()} sx={{ maxWidth: 320 }} />
};

/** Uso direto: a spec não tem `enum` em rádios. */
export const Radios: Story = {
  name: 'Rádios (uso direto)',
  tags: ['uso-direto'],
  render: () => (
    <Radio
      label="Tipo de pessoa"
      value="pf"
      options={[
        { value: 'pf', label: 'Física' },
        { value: 'pj', label: 'Jurídica' }
      ]}
      row
      onChange={fn()}
    />
  )
};

/** Cor em bolinhas (`display: "swatches"` na linha do formulário): enum com `color` em toda opção. */
export const Cores: Story = { name: 'Cores (bolinhas)', args: { field: 'cor', value: 'danger', display: 'swatches' } };
