import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import Box from '@mui/material/Box';

import { AgentStrip } from '@c3theme/chat';
import { AGENTES, avatarOf, PEDIDOS } from './agentes';

/**
 * Faixa pequena no topo da tela que se expande na pilha de pedidos dos agentes. Os botões só chamam os callbacks
 * (aparecem em Ações): aprovar, recusar, responder, parar, dispensar e abrir a conversa ficam com o app.
 */
const meta = {
  title: 'Chat/Faixa do topo',
  component: AgentStrip,
  args: {
    latest: { name: 'Atendente', avatar: AGENTES[0].avatar, state: 'talking', activity: 'Atendente respondendo a Marina' },
    requests: PEDIDOS,
    avatarOf,
    width: 420,
    height: 480,
    background: true,
    animate: true,
    onApprove: fn(),
    onDecline: fn(),
    onAnswer: fn(),
    onStop: fn(),
    onOpen: fn(),
    onDismiss: fn(),
    onExpandedChange: fn()
  },
  render: (args) => (
    <Box sx={{ display: 'flex', justifyContent: 'center', minHeight: 640 }}>
      <Box>
        <AgentStrip {...args} />
      </Box>
    </Box>
  )
} satisfies Meta<typeof AgentStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Recolhida: agente mais recente, o que ele está fazendo e quantos pedidos esperam. Clique para abrir. */
export const Recolhida: Story = {};

/** Aberta: aprovação, pergunta, falha e trabalho em andamento, nessa ordem. */
export const Aberta: Story = { args: { defaultExpanded: true } };

export const Aprovacao: Story = {
  name: 'Aprovação',
  args: { defaultExpanded: true, requests: PEDIDOS.filter((r) => r.kind === 'approval') }
};

export const Pergunta: Story = { args: { defaultExpanded: true, requests: PEDIDOS.filter((r) => r.kind === 'question') } };

export const Trabalhando: Story = { args: { defaultExpanded: true, requests: PEDIDOS.filter((r) => r.kind === 'progress') } };

export const Falha: Story = { args: { defaultExpanded: true, requests: PEDIDOS.filter((r) => r.kind === 'failure') } };

export const SemPedidos: Story = { name: 'Sem pedidos', args: { requests: [], defaultExpanded: true } };

/** Janela menor: largura e altura da pilha vêm do app. */
export const Compacta: Story = { args: { defaultExpanded: true, width: 320, height: 260 } };

/** Janela transparente: sem fundo nem sombra. */
export const SemFundo: Story = { name: 'Sem fundo', args: { background: false, defaultExpanded: true } };

// desenho do entalhe do MacBook (preto, cantos de baixo arredondados) por cima do meio da faixa
const Entalhe = ({ width }: { width: number }) => (
  <Box
    aria-hidden
    sx={{
      position: 'absolute',
      top: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width,
      height: 34,
      bgcolor: '#000',
      borderRadius: '0 0 12px 12px',
      zIndex: 1,
      pointerEvents: 'none'
    }}
  />
);

/**
 * Mac com entalhe (`notch={200}`): a faixa fica centrada no entalhe e a recolhida abre um vão do tamanho dele. Avatar e
 * atividade à esquerda, cortada com reticências antes do vão; contador e seta à direita. O vão não recebe clique e o
 * leitor de tela lê na mesma ordem. Aberta, a pilha desce abaixo do entalhe como antes.
 */
export const ComEntalhe: Story = {
  name: 'Com entalhe do Mac',
  args: {
    notch: 200,
    width: 560,
    latest: {
      name: 'Atendente',
      avatar: AGENTES[0].avatar,
      state: 'talking',
      activity: 'Atendente respondendo a Marina sobre o boleto de outubro'
    }
  },
  render: (args) => (
    <Box sx={{ display: 'flex', justifyContent: 'center', minHeight: 640 }}>
      <Box sx={{ position: 'relative' }}>
        <Entalhe width={args.notch ?? 0} />
        <AgentStrip {...args} />
      </Box>
    </Box>
  )
};

export const ComEntalheEscuro: Story = { ...ComEntalhe, name: 'Com entalhe do Mac, escuro', globals: { mode: 'dark' } };

/** Sem entalhe (`notch` 0 ou ausente), a mesma faixa larga continua uma linha só. */
export const SemEntalhe: Story = { name: 'Sem entalhe, mesma largura', args: { width: 560, latest: ComEntalhe.args!.latest } };
