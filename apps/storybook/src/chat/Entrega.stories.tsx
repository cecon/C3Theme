import type { Meta, StoryObj } from '@storybook/react-vite';
import Box from '@mui/material/Box';
import { AssistantMessage } from '@c3theme/chat';

const meta = {
  title: 'Chat/Entrega da resposta',
  component: AssistantMessage,
  args: {
    message: {
      id: 'whatsapp-1',
      conversationId: 'assistant',
      author: { id: 'bot', name: 'Assistente', kind: 'agent' },
      direction: 'in',
      text: 'Enviei o lembrete de cobrança ao cliente.',
      createdAt: '2026-11-12T12:00:00Z'
    }
  },
  render: (args) => (
    <Box sx={{ maxWidth: 640 }}>
      <AssistantMessage {...args} />
    </Box>
  )
} satisfies Meta<typeof AssistantMessage>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Sem declaração de entrega, nenhuma marca é adicionada à resposta. */
export const SemEntrega: Story = {};
export const Enviada: Story = { args: { message: { ...meta.args.message, entrega: { situacao: 'enviada' } } } };
export const Entregue: Story = { args: { message: { ...meta.args.message, entrega: { situacao: 'entregue' } } } };
export const Lida: Story = { args: { message: { ...meta.args.message, entrega: { situacao: 'lida' } } } };
/** O motivo fica visível, sem exigir hover nem inferir que o usuário deva reenviar. */
export const Falhou: Story = {
  args: { message: { ...meta.args.message, entrega: { situacao: 'falhou', motivo: 'O canal está desconectado.' } } }
};

/** Uma coluna estreita e motivo longo, inclusive um identificador sem espaços: o texto deve quebrar sem cortar. */
export const FalhaEmColunaEstreita: Story = {
  args: {
    message: {
      ...meta.args.message,
      entrega: { situacao: 'falhou', motivo: `O canal recusou a entrega. Referência: ${'destination_unavailable_'.repeat(6)}` }
    }
  },
  render: (args) => (
    <Box sx={{ width: 280, maxWidth: '100%' }}>
      <AssistantMessage {...args} />
    </Box>
  )
};
