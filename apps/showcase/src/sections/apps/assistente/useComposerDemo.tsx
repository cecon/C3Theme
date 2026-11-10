import { useMemo, useState, type ReactNode } from 'react';

// material-ui
import Box from '@mui/material/Box';

// third-party
import { Coin1, MessageAdd, Microphone2, Repeat, Shield, ShieldTick } from 'iconsax-reactjs';

import { ComposerIconButton, ComposerSelect, ContextRing, StatusLine, type AssistantPanelProps, type Message } from '@c3theme/chat';

const MODES = [
  { value: 'ask', label: 'Perguntar', description: 'Pede confirmação antes de alterar dados', icon: <ShieldTick size={16} /> },
  { value: 'full', label: 'Acesso total', description: 'Consulta e altera sem perguntar', icon: <Shield size={16} /> }
];
const MODELS = [
  { value: 'rapido', label: 'Rápido', description: 'Respostas curtas, mais barato' },
  { value: 'preciso', label: 'Preciso', description: 'Raciocina mais antes de responder' }
];
const EFFORTS = [
  { value: 'baixo', label: 'Baixo' },
  { value: 'medio', label: 'Médio' },
  { value: 'alto', label: 'Alto' }
];
const CONTEXT_TOKENS = 8000;

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const number = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });

/** Números da conversa como o backend mandaria: turnos, etapas, tokens (estimados aqui por 4 letras). */
function useStats(messages: Message[]) {
  return useMemo(() => {
    const turns = messages.filter((m) => m.direction === 'out').length;
    const steps = messages.reduce((n, m) => n + (m.tools?.length ?? 0), 0);
    const tokens = Math.round(messages.reduce((n, m) => n + (m.text?.length ?? 0) + (m.reasoning?.length ?? 0), 0) / 4);
    return { turns, steps, tokens };
  }, [messages]);
}

/**
 * A caixa do assistente na vitrine, no jeito dos apps de agente de mesa (`variant="split"`): o texto numa linha com o
 * enviar dentro; embaixo, +, voz, modelo, esforço e o anel do contexto. O modo vai para o cabeçalho do painel
 * (`selectors`). Tudo é estado local (num app, iria junto no envio); a linha de status é calculada da conversa. O
 * @c3theme/chat não sabe de provedor: tudo entra por props.
 */
export default function useComposerDemo(
  messages: Message[],
  onNewConversation: () => void,
  onVoice: () => void
): { composer: AssistantPanelProps['composer']; selectors: ReactNode } {
  const [mode, setMode] = useState('ask');
  const [model, setModel] = useState('preciso');
  const [effort, setEffort] = useState('medio');
  const stats = useStats(messages);

  const used = Math.min(100, Math.round((stats.tokens / CONTEXT_TOKENS) * 100));
  const selectors = (
    <>
      <ComposerSelect label="Modo" value={mode} options={MODES} onChange={setMode} />
      <ComposerIconButton label="Nova conversa" onClick={onNewConversation}>
        <MessageAdd size={16} />
      </ComposerIconButton>
    </>
  );
  const composer: AssistantPanelProps['composer'] = {
    variant: 'split',
    files: true,
    idleAction: { label: 'Conversar por voz', icon: <Microphone2 size={18} />, onClick: onVoice },
    endActions: (
      <>
        <ComposerSelect
          label="Modelo"
          value={model}
          options={MODELS}
          onChange={setModel}
          badge={
            <Box component="span" sx={{ px: 0.75, borderRadius: 1, bgcolor: 'action.selected', color: 'text.secondary', fontSize: 11 }}>
              8 mil
            </Box>
          }
        />
        <ComposerSelect label="Esforço" value={effort} options={EFFORTS} onChange={setEffort} />
        <ContextRing used={used} />
      </>
    ),
    status: (
      <StatusLine
        items={[
          {
            id: 'turnos',
            icon: <Repeat />,
            label: `${plural(stats.turns, 'turno', 'turnos')} · ${plural(stats.steps, 'etapa', 'etapas')}`
          },
          { id: 'tokens', icon: <Coin1 />, label: `${number.format(stats.tokens)} tokens`, title: 'Tokens usados nesta conversa' }
        ]}
      />
    )
  };
  return { composer, selectors };
}
