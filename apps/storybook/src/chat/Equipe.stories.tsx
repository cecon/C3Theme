import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';

import { AGENT_STATES, AuthorAvatar, HandoffMarker, MessageList, QuestionCard, TaskOwner, type AgentQuestion } from '@c3theme/chat';
import { ATENDENTE, avatarDe, CANAL, COZINHA, ESTADOS, TOOL_INPUT } from './equipe';

/** Canal com três agentes (Atendente, Cozinha, Entregas) e uma pessoa: cada agente com nome, cor e avatar no bloco. */
function Canal({ animate }: { animate: boolean }) {
  const [messages, setMessages] = useState(CANAL);
  const answer = (id: string, a: NonNullable<AgentQuestion['answer']>) =>
    setMessages((list) => list.map((m) => (m.id === id && m.question ? { ...m, question: { ...m.question, answer: a } } : m)));
  return (
    <Paper variant="outlined" sx={{ height: 640, display: 'flex', flexDirection: 'column', maxWidth: 760, overflow: 'hidden' }}>
      <TaskOwner
        owner={COZINHA}
        avatar={avatarDe(COZINHA)}
        state={ESTADOS.cozinha}
        task="Pedido 1.204: 2 lasanhas para a Marina"
        onReassign={fn()}
        onStop={fn()}
        onArchive={fn()}
        animate={animate}
      />
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <MessageList
          variant="assistant"
          title="Pedido 1.204"
          messages={messages}
          showAuthors
          renderAvatar={avatarDe}
          agentStates={ESTADOS}
          animate={animate}
          onAnswer={(m, a) => answer(m.id, a)}
          onOpenTask={fn()}
        />
      </Box>
    </Paper>
  );
}

const meta = {
  title: 'Chat/Vários agentes',
  id: 'chat-varios-agentes',
  component: Canal,
  args: { animate: true }
} satisfies Meta<typeof Canal>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Atendente passa a tarefa para a Cozinha, que pede aprovação para baixar o estoque; Entregas responde o prazo. */
export const CanalComTresAgentes: Story = { name: 'Canal com três agentes e uma pessoa' };

export const SemAnimacao: Story = { name: 'Sem animação', args: { animate: false } };

const APROVACAO: AgentQuestion = {
  id: 'ap',
  prompt: '',
  kind: 'approval',
  tool: { name: 'estoque_baixar', label: 'Baixar estoque', input: TOOL_INPUT }
};

/** "Permitir uma vez" é o principal (Ctrl+Enter); os argumentos ficam recolhidos. */
export const AprovacaoDeFerramenta: Story = {
  name: 'Aprovação de ferramenta',
  render: () => (
    <Box sx={{ maxWidth: 560 }}>
      <QuestionCard question={APROVACAO} agentName="Cozinha" onAnswer={fn()} active />
    </Box>
  )
};

export const AprovacaoRespondida: Story = {
  name: 'Aprovação respondida',
  render: () => (
    <Stack spacing={2} sx={{ maxWidth: 560 }}>
      <QuestionCard question={{ ...APROVACAO, answer: { optionIds: ['allow_once'] } }} agentName="Cozinha" />
      <QuestionCard question={{ ...APROVACAO, answer: { optionIds: ['allow_always'] } }} agentName="Cozinha" />
      <QuestionCard question={{ ...APROVACAO, answer: { optionIds: ['decline'] } }} agentName="Cozinha" />
    </Stack>
  )
};

export const PassagemDeTarefa: Story = {
  name: 'Passagem de tarefa',
  render: () => (
    <Stack spacing={1} sx={{ maxWidth: 640 }}>
      <HandoffMarker
        handoff={{ from: ATENDENTE, to: COZINHA, task: 'confirmar 2 lasanhas', taskId: 't1' }}
        renderAvatar={avatarDe}
        onOpen={fn()}
      />
      <HandoffMarker handoff={{ from: COZINHA, to: ATENDENTE, task: 'avisar a Marina que saiu' }} renderAvatar={avatarDe} />
    </Stack>
  )
};

export const DonoDaTarefa: Story = {
  name: 'Dono da tarefa',
  render: () => (
    <Paper variant="outlined" sx={{ maxWidth: 640 }}>
      <TaskOwner
        owner={ATENDENTE}
        avatar={avatarDe(ATENDENTE)}
        state="waiting"
        task="Responder a Marina sobre o boleto"
        onReassign={fn()}
        onStop={fn()}
        onArchive={fn()}
      />
    </Paper>
  )
};

/** O anel de cada estado em volta do avatar do autor (o nome e o estado vão por extenso ao lado, na lista). */
export const AvatarComEstado: Story = {
  name: 'Avatar com estado',
  render: () => (
    <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
      {AGENT_STATES.map((s) => (
        <AuthorAvatar key={s} author={COZINHA} avatar={avatarDe(COZINHA)} state={s} size={40} />
      ))}
    </Stack>
  )
};
