import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { AGENT_STATES, AgentDock, AgentPresence } from '@c3theme/chat';
import { AGENTES, CONVERSA_AGENTE } from './agentes';

/**
 * Coluna de agentes presa à borda da tela (no app desktop, numa janela por cima dos outros). Cada item mostra o
 * estado no anel e o selo do que espera a pessoa; clicar abre o balão de conversa para dentro da tela.
 */
const meta = {
  title: 'Chat/Doca de agentes',
  component: AgentDock,
  args: {
    agents: AGENTES,
    side: 'right',
    animate: true,
    background: true,
    messagesOf: () => CONVERSA_AGENTE,
    onReply: fn(),
    onOpenConversation: fn(),
    onOpenChange: fn()
  },
  argTypes: { side: { control: 'inline-radio', options: ['left', 'right'] } },
  render: (args) => (
    <Box sx={{ display: 'flex', justifyContent: args.side === 'left' ? 'flex-start' : 'flex-end', height: 560 }}>
      <AgentDock {...args} />
    </Box>
  )
} satisfies Meta<typeof AgentDock>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Um agente em cada estado: esperando você (com selo), trabalhando, pensando, falando, erro, pausado, terminou, parado. */
export const TodosOsEstados: Story = { name: 'Todos os estados' };

/** Balão aberto no Atendente: últimas mensagens, resposta rápida e "Abrir conversa". */
export const BalaoAberto: Story = {
  name: 'Balão aberto',
  render: function Render(args) {
    const [open, setOpen] = useState<string | null>('atendente');
    return (
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', height: 560 }}>
        <AgentDock {...args} openId={open} onOpenChange={setOpen} />
      </Box>
    );
  }
};

/** Doca na borda esquerda: o balão abre para a direita. */
export const LadoEsquerdo: Story = { name: 'Lado esquerdo', args: { side: 'left' } };

/** Mais agentes do que cabem: rola, e as bordas de cima e de baixo esmaecem. */
export const ComRolagem: Story = {
  name: 'Com rolagem',
  args: {
    maxHeight: 300,
    agents: [...AGENTES, ...AGENTES.map((a) => ({ ...a, id: `${a.id}-2`, name: `${a.name} 2`, pending: undefined }))]
  }
};

/** O app desliga o movimento quando a pessoa está em outro app (e o sistema pode pedir menos movimento). */
export const SemAnimacao: Story = { name: 'Sem animação', args: { animate: false } };

/** Janela transparente: sem fundo nem borda, sobre o que estiver atrás. */
export const SemFundo: Story = {
  name: 'Sem fundo',
  args: { background: false },
  render: (args) => (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'flex-end',
        height: 560,
        p: 2,
        borderRadius: 2,
        background: (theme) => `repeating-linear-gradient(45deg, ${theme.vars.palette.action.hover} 0 12px, transparent 12px 24px)`
      }}
    >
      <AgentDock {...args} />
    </Box>
  )
};

/** O anel de cada estado lado a lado, com o nome do estado. */
export const Estados: Story = {
  render: (args) => (
    <Stack direction="row" spacing={3} useFlexGap sx={{ flexWrap: 'wrap' }}>
      {AGENT_STATES.map((state, i) => (
        <Stack key={state} spacing={1} sx={{ alignItems: 'center', width: 88 }}>
          <AgentPresence avatar={AGENTES[i].avatar} state={state} pending={state === 'waiting' ? 1 : 0} animate={args.animate} />
          <Typography variant="caption" color="text.secondary">
            {state}
          </Typography>
        </Stack>
      ))}
    </Stack>
  )
};
