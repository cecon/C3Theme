import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';

import { Microphone2 } from 'iconsax-reactjs';

import { AgentComposer, ComposerSelect, ContextRing, VoiceConversation, type VoiceCaption, type VoiceState } from '@c3theme/chat';

/**
 * A caixa do agente no jeito dos apps de mesa (`variant="split"`): o texto numa linha com o enviar dentro e, embaixo,
 * a barra com +, voz, modelo, esforço e o anel do contexto. O microfone abre a conversa por voz ao vivo
 * (`VoiceConversation`): a bola pulsa com quem fala, o estado e a legenda aparecem embaixo. O áudio é do app; aqui
 * o estado é simulado.
 */
const meta = {
  title: 'Chat/Voz e caixa com barra',
  component: VoiceConversation,
  args: { state: 'listening', level: 0.4, onEnd: fn(), onToggleMute: fn() },
  argTypes: { state: { control: 'inline-radio', options: ['connecting', 'listening', 'thinking', 'speaking', 'error'] } },
  render: (args) => (
    <Paper variant="outlined" sx={{ height: 520, maxWidth: 420, display: 'flex', borderRadius: 3 }}>
      <VoiceConversation {...args} />
    </Paper>
  )
} satisfies Meta<typeof VoiceConversation>;

export default meta;
type Story = StoryObj<typeof meta>;

const MODELS = [
  { value: 'opus', label: 'Opus 5.5' },
  { value: 'sonnet', label: 'Sonnet 5.5' }
];
const EFFORTS = [
  { value: 'baixo', label: 'Baixo' },
  { value: 'medio', label: 'Médio' },
  { value: 'alto', label: 'Alto' }
];

/** Texto numa linha com o Enter dentro; embaixo, +, voz, seletores e o anel do contexto. */
export const CaixaComBarra: Story = {
  name: 'Caixa com barra embaixo',
  render: function Render() {
    const [text, setText] = useState('');
    const [model, setModel] = useState('opus');
    const [effort, setEffort] = useState('medio');
    return (
      <Box sx={{ maxWidth: 720 }}>
        <AgentComposer
          variant="split"
          value={text}
          onChange={setText}
          onSend={() => setText('')}
          placeholder="Faça uma pergunta ou comece uma tarefa…"
          idleAction={{ label: 'Conversar por voz', icon: <Microphone2 size={18} />, onClick: fn() }}
          endActions={
            <>
              <ComposerSelect label="Modelo" value={model} options={MODELS} onChange={setModel} />
              <ComposerSelect label="Esforço" value={effort} options={EFFORTS} onChange={setEffort} />
              <ContextRing used={38} />
            </>
          }
        />
      </Box>
    );
  }
};

const ROTEIRO: { state: VoiceState; caption?: VoiceCaption }[] = [
  { state: 'connecting' },
  { state: 'listening', caption: { who: 'user', text: 'Quanto vendemos ontem?' } },
  { state: 'thinking' },
  { state: 'speaking', caption: { who: 'assistant', text: 'Ontem foram R$ 12.400 em 38 pedidos, 9% acima da média.' } }
];

/** Conecta, ouve, pensa e fala em ciclo, com a bola seguindo o volume simulado. */
export const ConversaAoVivo: Story = {
  name: 'Conversa por voz ao vivo',
  render: function Render(args) {
    const [step, setStep] = useState(0);
    const [level, setLevel] = useState(0);
    const [muted, setMuted] = useState(false);
    useEffect(() => {
      const timer = setInterval(() => setStep((s) => (s + 1) % ROTEIRO.length), 2600);
      const wave = setInterval(() => setLevel(Math.random()), 120);
      return () => {
        clearInterval(timer);
        clearInterval(wave);
      };
    }, []);
    const now = ROTEIRO[step];
    const captions = ROTEIRO.slice(0, step + 1).flatMap((r) => (r.caption ? [r.caption] : []));
    return (
      <Paper variant="outlined" sx={{ height: 520, maxWidth: 420, display: 'flex', borderRadius: 3 }}>
        <VoiceConversation
          state={now.state}
          level={level}
          captions={captions}
          muted={muted}
          onToggleMute={() => setMuted((m) => !m)}
          onEnd={args.onEnd}
        />
      </Paper>
    );
  }
};

export const Ouvindo: Story = { args: { captions: [{ who: 'user', text: 'Quanto vendemos ontem?' }] } };
export const Pensando: Story = { args: { state: 'thinking' } };
export const Falando: Story = {
  args: { state: 'speaking', level: 0.7, captions: [{ who: 'assistant', text: 'Ontem foram R$ 12.400 em 38 pedidos.' }] }
};
export const Erro: Story = { args: { state: 'error', error: 'Sem conexão com a voz. Tente de novo.' } };
