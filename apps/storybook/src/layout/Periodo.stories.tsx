import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { PeriodFilter, SelectField, shortcutPeriod } from '@c3theme/ui';
import MotorScreen from '../motor/MotorScreen';
import { jsonSource } from '../motor/source';
import { withMotor } from '../motor/withMotor';
import { stateful } from '../support/stateful';

const Period = stateful(PeriodFilter);

/**
 * No motor, o período é o `dateRange` da lista ("Emitidas de / até" no campo de data), na história "Na lista". A barra
 * de relatório com atalhos, Filtrar e Imprimir (`PeriodFilter`) o motor ainda não usa: as outras histórias são uso
 * direto, para relatório feito em código.
 */
const meta = {
  title: 'Layout/Consulta por período',
  component: PeriodFilter,
  args: {
    value: shortcutPeriod('thisMonth'),
    shortcuts: true,
    required: false,
    loading: false,
    onChange: fn(),
    onFilter: fn(),
    onPrint: fn()
  },
  render: (args) => <Period {...args} />
} satisfies Meta<typeof PeriodFilter>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Pelo motor: `views.list.dateRange` no campo `emissao`. */
export const NaLista: Story = {
  name: 'Na lista',
  decorators: [withMotor],
  parameters: { docs: { source: jsonSource }, motor: { entity: 'fatura' } },
  render: () => <MotorScreen entity="fatura" />
};

export const Periodo: Story = { name: 'Período (uso direto)', tags: ['uso-direto'] };

export const Obrigatorio: Story = {
  name: 'Datas obrigatórias (uso direto)',
  tags: ['uso-direto'],
  args: { value: { from: null, to: null }, required: true }
};

export const ComFiltroExtra: Story = {
  name: 'Com filtro extra (uso direto)',
  tags: ['uso-direto'],
  render: (args) => (
    <Period {...args}>
      <SelectField
        label="Filial"
        value="1"
        options={[
          { value: '1', label: 'Matriz' },
          { value: '2', label: 'Centro' }
        ]}
        onChange={fn()}
        fullWidth={false}
        sx={{ minWidth: 180 }}
      />
    </Period>
  )
};
