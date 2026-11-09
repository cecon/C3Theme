import type { Meta, StoryObj } from '@storybook/react-vite';
import { User } from 'iconsax-reactjs';

import Stack from '@mui/material/Stack';

import { SoftAvatar } from '@c3theme/ui';
import { TONES } from '../support/tones';

/** Primitiva do catálogo (exceção 2 do ADR 0001). No motor ela é a coluna com `avatar` da lista e o responsável do quadro: veja "Tabela/Lista pelo motor". */
const meta = {
  title: 'Componentes/SoftAvatar',
  component: SoftAvatar,
  args: { children: 'AS', tone: 'primary', size: 'md', look: 'soft' },
  argTypes: {
    tone: { control: 'select', options: TONES },
    size: { control: 'inline-radio', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    look: { control: 'inline-radio', options: ['soft', 'filled', 'outlined'] }
  }
} satisfies Meta<typeof SoftAvatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Iniciais: Story = {};

export const Icone: Story = { name: 'Ícone', args: { children: <User size={20} /> } };

export const Tons: Story = {
  render: (args) => (
    <Stack spacing={2}>
      {(['soft', 'filled', 'outlined'] as const).map((look) => (
        <Stack key={look} direction="row" spacing={1}>
          {TONES.map((tone) => (
            <SoftAvatar key={tone} {...args} look={look} tone={tone} />
          ))}
        </Stack>
      ))}
    </Stack>
  )
};
