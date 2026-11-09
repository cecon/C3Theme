import type { Meta, StoryObj } from '@storybook/react-vite';

import Stack from '@mui/material/Stack';

import { CircularWithLabel, Dot, LinearWithLabel } from '@c3theme/ui';
import { TONES } from '../support/tones';

const COLORS = ['primary', 'secondary', 'info', 'success', 'warning', 'error'] as const;

const meta = {
  title: 'Componentes/Progresso',
  component: LinearWithLabel,
  args: { value: 64, label: 'Meta do mês', color: 'primary' },
  argTypes: { value: { control: { type: 'range', min: 0, max: 100 } }, color: { control: 'select', options: COLORS } }
} satisfies Meta<typeof LinearWithLabel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Linear: Story = {};

export const Circular: Story = {
  render: ({ value, color }) => (
    <Stack direction="row" spacing={2}>
      <CircularWithLabel value={value} color={color} />
      <CircularWithLabel value={value} color={color} size={80} />
    </Stack>
  )
};

/** Ponto de status: o mesmo dos menus, listas e avisos. */
export const Pontos: Story = {
  render: () => (
    <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
      {TONES.map((tone) => (
        <Dot key={tone} tone={tone} size={10} />
      ))}
    </Stack>
  )
};
