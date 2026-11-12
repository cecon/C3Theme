import type { Meta, StoryObj } from '@storybook/react-vite';

import Stack from '@mui/material/Stack';

import { StatusChip, type StatusTone } from '@c3theme/ui';
import { TONES } from '../support/tones';

const STATUS: StatusTone[] = TONES.filter((t): t is StatusTone => t !== 'secondary');

/** Primitiva do vocabulário do motor (não é tela, ADR 0003). No motor ela é o chip do `enum` com `color` na lista e no formulário: veja "Tabela/Lista pelo motor". */
const meta = {
  title: 'Componentes/StatusChip',
  component: StatusChip,
  args: { label: 'Pago', tone: 'success', size: 'small' },
  argTypes: { tone: { control: 'select', options: STATUS } }
} satisfies Meta<typeof StatusChip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basico: Story = { name: 'Básico' };

export const Tons: Story = {
  render: (args) => (
    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
      {STATUS.map((tone) => (
        <StatusChip key={tone} {...args} tone={tone} label={tone} />
      ))}
    </Stack>
  )
};
