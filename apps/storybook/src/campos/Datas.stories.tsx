import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { DateField } from '@c3theme/ui';
import MotorField from '../motor/MotorField';
import { jsonSource } from '../motor/source';
import { withMotor } from '../motor/withMotor';
import { stateful } from '../support/stateful';

const DateStory = stateful(DateField);

/** Pelo motor: `date` e `datetime`. Digitação com máscara do idioma e calendário próprio; o valor é ISO. */
const meta = {
  title: 'Campos/Data e hora',
  component: MotorField,
  decorators: [withMotor],
  parameters: { docs: { source: jsonSource } },
  args: { entity: 'fatura', field: 'vencimento', value: '2026-11-08', onChange: fn() }
} satisfies Meta<typeof MotorField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Data: Story = {};

export const Vazia: Story = { args: { value: null } };

export const ComErro: Story = { name: 'Com erro', args: { value: null, error: 'Informe o vencimento.' } };

/** `datetime` trafega em UTC; o campo mostra e edita no fuso de quem usa (hora de 24 h). */
export const DataEHora: Story = { name: 'Data e hora', args: { field: 'agendado', value: '2026-11-08T17:30:00Z' } };

/** Uso direto: a spec ainda não tem mínimo e máximo de data (`min`/`max` são só de número). */
export const ComLimites: Story = {
  name: 'Com mínimo e máximo (uso direto)',
  tags: ['uso-direto'],
  render: () => (
    <DateStory
      label="Vencimento"
      value="2026-11-08"
      min="2026-11-01"
      max="2026-11-30"
      helperText="Só dias de novembro"
      onChange={fn()}
      sx={{ maxWidth: 280 }}
    />
  )
};
