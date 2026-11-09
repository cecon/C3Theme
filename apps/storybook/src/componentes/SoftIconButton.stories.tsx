import type { Meta, StoryObj } from '@storybook/react-vite';
import { Edit2, Eye, Trash } from 'iconsax-reactjs';
import { fn } from 'storybook/test';

import Stack from '@mui/material/Stack';

import { SoftIconButton } from '@c3theme/ui';
import { TONES } from '../support/tones';

/** Primitiva do catálogo (exceção 2 do ADR 0001). No motor ela forma as ações da linha (`rowActions`) da lista: veja "Tabela/Lista pelo motor". */
const meta = {
  title: 'Componentes/SoftIconButton',
  component: SoftIconButton,
  args: { 'aria-label': 'Editar', children: <Edit2 size={18} />, tone: 'primary', look: 'soft', shape: 'rounded', onClick: fn() },
  argTypes: {
    tone: { control: 'select', options: TONES },
    look: { control: 'inline-radio', options: ['soft', 'outlined', 'dashed'] },
    shape: { control: 'inline-radio', options: ['rounded', 'circle'] }
  }
} satisfies Meta<typeof SoftIconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basico: Story = { name: 'Básico' };

export const AcoesDeLinha: Story = {
  name: 'Ações de linha',
  render: (args) => (
    <Stack direction="row" spacing={1}>
      <SoftIconButton {...args} aria-label="Ver" tone="info">
        <Eye size={18} />
      </SoftIconButton>
      <SoftIconButton {...args} aria-label="Editar" tone="primary">
        <Edit2 size={18} />
      </SoftIconButton>
      <SoftIconButton {...args} aria-label="Excluir" tone="danger">
        <Trash size={18} />
      </SoftIconButton>
    </Stack>
  )
};

export const Tons: Story = {
  render: (args) => (
    <Stack spacing={2}>
      {(['soft', 'outlined', 'dashed'] as const).map((look) => (
        <Stack key={look} direction="row" spacing={1}>
          {TONES.map((tone) => (
            <SoftIconButton key={tone} {...args} look={look} tone={tone} aria-label={`${look} ${tone}`} />
          ))}
        </Stack>
      ))}
    </Stack>
  )
};
