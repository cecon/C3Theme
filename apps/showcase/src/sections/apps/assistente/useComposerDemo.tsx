import { useMemo, useState } from 'react';

// material-ui
import Box from '@mui/material/Box';

// third-party
import { Coin1, Repeat, Shield, ShieldTick } from 'iconsax-reactjs';

import { ComposerSelect, StatusLine, type AssistantPanelProps, type Message } from '@c3theme/chat';

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
 * A barra da caixa do assistente na vitrine: modo, modelo e esforço (só estado local; num app, iriam junto no
 * envio) e a linha de status calculada da conversa. O @c3theme/chat não sabe de provedor: tudo entra por props.
 */
export default function useComposerDemo(messages: Message[]): AssistantPanelProps['composer'] {
  const [mode, setMode] = useState('ask');
  const [model, setModel] = useState('preciso');
  const [effort, setEffort] = useState('medio');
  const stats = useStats(messages);

  return {
    files: false,
    startActions: <ComposerSelect label="Modo" value={mode} options={MODES} onChange={setMode} />,
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
        progress={(stats.tokens / CONTEXT_TOKENS) * 100}
        progressLabel="Contexto usado"
      />
    )
  };
}
