import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import Box from '@mui/material/Box';

import { AgentComposer, AssistantMessage, QuestionCard, type AgentQuestion } from '@c3theme/chat';
import { RESPOSTA } from './mensagens';

const PERGUNTA: AgentQuestion = {
  id: 'q1',
  prompt: 'Mando o lembrete de cobrança para quem?',
  kind: 'single',
  allowText: true,
  options: [
    { id: 'todos', label: 'Para os três', primary: true },
    { id: 'ana', label: 'Só para a Ana' },
    { id: 'nao', label: 'Agora não' }
  ]
};

const meta = {
  title: 'Chat/Assistente de IA',
  component: AssistantMessage,
  args: { message: RESPOSTA, onRegenerate: fn(), onOpenWorkspace: fn() },
  render: (args) => (
    <Box sx={{ maxWidth: 720 }}>
      <AssistantMessage {...args} />
    </Box>
  )
} satisfies Meta<typeof AssistantMessage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Resposta em Markdown (tabela) com as ferramentas que o assistente usou. */
export const Resposta: Story = {};

export const Pensando: Story = { args: { message: { ...RESPOSTA, id: 'r2', text: '', tools: [], streaming: true } } };

export const Escrevendo: Story = { args: { message: { ...RESPOSTA, id: 'r3', text: 'Encontrei **3 faturas', streaming: true } } };

/** Pergunta com opções: clicar responde; Ctrl+Enter escolhe a principal. */
export const Pergunta: Story = {
  render: () => (
    <Box sx={{ maxWidth: 560 }}>
      <QuestionCard question={PERGUNTA} onAnswer={fn()} active />
    </Box>
  )
};

export const CaixaDoAssistente: Story = {
  name: 'Caixa do assistente',
  render: function Render() {
    const [text, setText] = useState('');
    return (
      <Box sx={{ maxWidth: 720 }}>
        <AgentComposer value={text} onChange={setText} onSend={() => setText('')} files placeholder="Pergunte sobre suas faturas" />
      </Box>
    );
  }
};
