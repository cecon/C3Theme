import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';

import { Composer, ConversationList, MessageList, TypingIndicator } from '@c3theme/chat';
import { ANA, CONVERSA, CONVERSAS } from './mensagens';

/** Conversa entre pessoas (atendimento, WhatsApp): balões agrupados, situação do envio e reenviar. */
function Conversa({ typing }: { typing: boolean }) {
  return (
    <Paper variant="outlined" sx={{ height: 420, display: 'flex', flexDirection: 'column', maxWidth: 560 }}>
      <MessageList title="Ana Souza" messages={CONVERSA} onRetry={fn()} typing={typing ? [ANA] : []} />
    </Paper>
  );
}

const meta = {
  title: 'Chat/Pessoas',
  component: Conversa,
  args: { typing: false }
} satisfies Meta<typeof Conversa>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Mensagens: Story = {};

export const Digitando: Story = { args: { typing: true } };

export const CaixaDeTexto: Story = {
  name: 'Caixa de texto',
  render: function Render() {
    const [text, setText] = useState('');
    return (
      <Box sx={{ maxWidth: 560 }}>
        <Composer value={text} onChange={setText} onSend={() => setText('')} files />
      </Box>
    );
  }
};

export const ListaDeConversas: Story = {
  name: 'Lista de conversas',
  render: function Render() {
    const [selected, setSelected] = useState('c1');
    return (
      <Paper variant="outlined" sx={{ maxWidth: 360 }}>
        <ConversationList conversations={CONVERSAS} selectedId={selected} onSelect={setSelected} />
      </Paper>
    );
  }
};

export const SoODigitando: Story = { name: 'Indicador de digitando', render: () => <TypingIndicator authors={[ANA]} /> };
