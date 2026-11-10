import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import Box from '@mui/material/Box';

import { MessageAdd, Microphone2, Sound } from 'iconsax-reactjs';

import { AgentComposer, AssistantMessage, ComposerIconButton, QuestionCard, type AgentQuestion } from '@c3theme/chat';
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

/**
 * `variant="inline"`: uma linha só (46 px), + à esquerda, ações redondas de 28 px à direita (`ComposerIconButton`) e o
 * botão principal em círculo. Vazio, ele mostra a ação de espera (`idleAction`, aqui a conversa por voz); com texto,
 * vira enviar. Foco só clareia a borda, sem linha de ajuda.
 */
export const CaixaNumaLinha: Story = {
  name: 'Caixa numa linha',
  render: function Render() {
    const [text, setText] = useState('');
    return (
      <Box sx={{ maxWidth: 720 }}>
        <AgentComposer
          variant="inline"
          value={text}
          onChange={setText}
          onSend={() => setText('')}
          placeholder="Mensagem para Ada"
          idleAction={{ label: 'Conversar por voz', icon: <Sound size={16} />, onClick: fn() }}
          endActions={
            <>
              <ComposerIconButton label="Nova conversa" onClick={fn()}>
                <MessageAdd size={16} />
              </ComposerIconButton>
              <ComposerIconButton label="Ditar" onClick={fn()}>
                <Microphone2 size={16} />
              </ComposerIconButton>
            </>
          }
        />
      </Box>
    );
  }
};
