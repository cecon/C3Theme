import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, userEvent, within } from 'storybook/test';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';

import { AgentComposer, ModelPicker, type ModelPickerProps } from '@c3theme/chat';
import { stateful } from '../support/stateful';
import { MODELOS } from './modelos';

const Picker = stateful(ModelPicker);

/** Principal + reserva com estado de verdade (o reserva é limpo quando vira o principal). */
function ComReserva(props: Omit<ModelPickerProps, 'fallback'>) {
  const [value, setValue] = useState(props.value);
  const [fallback, setFallback] = useState<string | null>('ollama/qwen2.5-coder:7b');
  return (
    <ModelPicker
      {...props}
      value={value}
      onChange={(v) => {
        setValue(v);
        props.onChange(v);
      }}
      fallback={{ value: fallback, onChange: setFallback }}
    />
  );
}

const meta = {
  title: 'Chat/Seletor de modelo',
  component: ModelPicker,
  args: { groups: MODELOS, value: 'opencode/grok-code', onChange: fn(), variant: 'composer', size: 'small' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['composer', 'field'] },
    size: { control: 'inline-radio', options: ['small', 'medium'] }
  },
  render: (args) => <Picker {...args} />
} satisfies Meta<typeof ModelPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Botão da barra: 3 provedores, 30 modelos; grátis, locais, um provedor que precisa entrar e dois fora do ar. */
export const NoCompositor: Story = { name: 'No compositor' };

/** Lista aberta (o axe confere a lista também, no claro e no escuro). Setas, digitar para buscar e Enter. */
export const Aberto: Story = {
  render: (args) => (
    <Box sx={{ pt: '440px' }}>
      <Picker {...args} />
    </Box>
  ),
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: /Modelo/ }));
  }
};

/** Busca sem acento e por provedor: "anthropic son" acha os Sonnet da Anthropic. */
export const Buscando: Story = {
  render: (args) => (
    <Box sx={{ pt: '440px' }}>
      <Picker {...args} />
    </Box>
  ),
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: /Modelo/ }));
    await userEvent.keyboard('anthropic son');
  }
};

export const NoCompositorMedio: Story = { name: 'No compositor (médio)', args: { size: 'medium' } };

/** Dentro da caixa do assistente, ao lado do envio. */
export const NaCaixaDoAssistente: Story = {
  name: 'Na caixa do assistente',
  render: function Render(args) {
    const [text, setText] = useState('');
    return (
      <Box sx={{ maxWidth: 720 }}>
        <AgentComposer value={text} onChange={setText} onSend={() => setText('')} endActions={<Picker {...args} />} />
      </Box>
    );
  }
};

/** Campo de formulário, nos dois tamanhos. */
export const EmFormulario: Story = {
  name: 'Em formulário',
  args: { variant: 'field' },
  render: (args) => (
    <Stack spacing={3} sx={{ maxWidth: 420 }}>
      <Picker {...args} size="small" />
      <Picker {...args} size="medium" value="ollama/phi4" />
    </Stack>
  )
};

export const SemEscolha: Story = { name: 'Sem escolha', args: { variant: 'field', value: null } };

/** "Se este falhar, usar": sem o principal e sem os indisponíveis, com "Sem reserva". */
export const ModeloReserva: Story = {
  name: 'Modelo reserva',
  render: (args) => (
    <Stack spacing={4}>
      <ComReserva {...args} variant="composer" />
      <Box sx={{ maxWidth: 640 }}>
        <ComReserva {...args} variant="field" />
      </Box>
    </Stack>
  )
};

export const Desabilitado: Story = { args: { disabled: true } };
