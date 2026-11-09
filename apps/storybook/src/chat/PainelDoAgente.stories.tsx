import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

import { AgentNowCard, AgentTimeline, ContextMeter, RecentFiles, type AgentEvent, type AgentFile } from '@c3theme/chat';

// horários relativos a agora: a linha do tempo mostra "Ontem" quando o dia muda
const hoje = (h: number, m: number) => {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};
const ontem = (h: number, m: number) => new Date(new Date(hoje(h, m)).getTime() - 864e5).toISOString();

const EVENTOS: AgentEvent[] = [
  { id: 'e6', at: hoje(10, 43), kind: 'replied', text: 'Respondeu a Marina com o total' },
  { id: 'e5', at: hoje(10, 42), kind: 'delegated', text: 'Pediu à Entregas o frete do Centro' },
  { id: 'e4', at: hoje(10, 42), kind: 'delegated', text: 'Pediu à Cozinha para confirmar o estoque' },
  { id: 'e3', at: hoje(10, 41), kind: 'tool', text: 'Consultou o cardápio' },
  { id: 'e2', at: hoje(10, 41), kind: 'received', text: 'Recebeu pedido pelo WhatsApp' }
];

const ANTIGOS: AgentEvent[] = [
  { id: 'e1', at: ontem(23, 2), kind: 'error', text: 'Não conseguiu mandar o resumo: o e-mail do contador voltou' },
  { id: 'e0', at: ontem(23, 0), kind: 'tool', text: 'Fechou o caixa do dia' }
];

const ARQUIVOS: AgentFile[] = [
  { id: 'f1', name: 'cardapio-novembro.pdf', size: 212 * 1024 },
  { id: 'f2', name: 'pedidos-hoje.csv', size: 8 * 1024 },
  { id: 'f3', name: 'fotos-do-prato-do-dia-para-o-instagram-versao-final.zip', size: 4.2 * 1024 * 1024 }
];

const meta = {
  title: 'Chat/Painel do agente',
  component: AgentNowCard,
  args: { label: 'Fazendo agora', children: 'Calculando o frete do pedido da Marina', tone: 'working' },
  argTypes: { tone: { control: 'inline-radio', options: ['neutral', 'working', 'waiting', 'error', 'done'] } },
  render: (args) => (
    <Box sx={{ maxWidth: 320 }}>
      <AgentNowCard {...args} />
    </Box>
  )
} satisfies Meta<typeof AgentNowCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** O painel inteiro, na largura da coluna da direita, como o app compõe. */
export const Painel: Story = {
  render: function Render() {
    const [eventos, setEventos] = useState(EVENTOS);
    const [carregando, setCarregando] = useState(false);
    const carregar = () => {
      setCarregando(true);
      setTimeout(() => {
        setEventos((e) => [...e, ...ANTIGOS]);
        setCarregando(false);
      }, 600);
    };
    return (
      <Stack spacing={1.5} sx={{ width: 320, p: 1.5, bgcolor: 'background.default', borderRadius: 2 }}>
        <AgentNowCard label="Fazendo agora" tone="working">
          Calculando o frete do pedido da Marina
        </AgentNowCard>
        <AgentNowCard label="Esperando" tone="waiting">
          Marina confirmar o pedido
        </AgentNowCard>
        <ContextMeter used={62} summarizeAt={85} />
        <AgentTimeline
          events={eventos}
          onOpen={fn()}
          hasMore={eventos.length === EVENTOS.length}
          loadingMore={carregando}
          onLoadMore={carregar}
        />
        <RecentFiles files={ARQUIVOS.slice(0, 2)} onOpen={fn()} />
      </Stack>
    );
  }
};

/** Cartão "Fazendo agora": troque o tom nos Controles. */
export const FazendoAgora: Story = { name: 'Fazendo agora' };

/** Espera: borda e ponto em aviso, com a ação que destrava o agente. */
export const Esperando: Story = {
  args: {
    label: 'Esperando você',
    tone: 'waiting',
    children: 'Aprovar o desconto de 15% para a Marina',
    action: (
      <Button size="small" variant="outlined">
        Ver
      </Button>
    )
  }
};

export const Parou: Story = {
  args: { label: 'Parou', tone: 'error', children: 'O plugin de frete não respondeu em 30 s' }
};

/** Medidor: perto do resumo automático, a barra fica em aviso. */
export const Contexto: Story = {
  render: () => (
    <Stack spacing={1.5} sx={{ width: 320 }}>
      <ContextMeter used={62} summarizeAt={85} />
      <ContextMeter used={79} summarizeAt={85} />
      <ContextMeter used={41} caption="82 mil de 200 mil tokens" />
    </Stack>
  )
};

/** Linha do tempo com dia anterior, erro e "Carregar mais". */
export const LinhaDoTempo: Story = {
  name: 'Linha do tempo',
  render: () => (
    <Box sx={{ width: 320 }}>
      <AgentTimeline events={[...EVENTOS, ...ANTIGOS]} onOpen={fn()} hasMore onLoadMore={fn()} />
    </Box>
  )
};

export const Vazio: Story = {
  render: () => (
    <Stack spacing={1.5} sx={{ width: 320 }}>
      <AgentNowCard label="Fazendo agora">Nada, esperando trabalho</AgentNowCard>
      <ContextMeter used={0} summarizeAt={85} />
      <AgentTimeline events={[]} />
      <RecentFiles files={[]} />
    </Stack>
  )
};

/** Nome comprido corta com reticências; o nome inteiro fica na dica. */
export const Arquivos: Story = {
  render: () => (
    <Box sx={{ width: 320 }}>
      <RecentFiles files={ARQUIVOS} onOpen={fn()} />
    </Box>
  )
};
