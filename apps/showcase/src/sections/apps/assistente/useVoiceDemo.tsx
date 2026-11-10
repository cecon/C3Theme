import { useEffect, useState } from 'react';

import type { VoiceCaption, VoiceConversationProps, VoiceState } from '@c3theme/chat';

const SCRIPT: { state: VoiceState; caption?: VoiceCaption; ms: number }[] = [
  { state: 'connecting', ms: 1200 },
  { state: 'listening', caption: { who: 'user', text: 'Quanto vendemos ontem?' }, ms: 2600 },
  { state: 'thinking', ms: 1600 },
  { state: 'speaking', caption: { who: 'assistant', text: 'Ontem foram R$ 12.400 em 38 pedidos, 9% acima da média.' }, ms: 3200 },
  { state: 'listening', ms: 4000 }
];

/**
 * Conversa por voz roteirizada para a vitrine: conecta, ouve, pensa e fala, com o volume sorteado. Num app, o estado
 * e o volume vêm da sessão de voz do provedor (`useAudioLevel` mede o microfone); o componente é o mesmo.
 */
export default function useVoiceDemo(): { voice?: VoiceConversationProps; start: () => void } {
  const [on, setOn] = useState(false);
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState(0);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (!on || step >= SCRIPT.length - 1) return;
    const timer = setTimeout(() => setStep((s) => s + 1), SCRIPT[step].ms);
    return () => clearTimeout(timer);
  }, [on, step]);
  useEffect(() => {
    if (!on) return;
    const wave = setInterval(() => setLevel(Math.random()), 120);
    return () => clearInterval(wave);
  }, [on]);

  const start = () => {
    setStep(0);
    setMuted(false);
    setOn(true);
  };
  if (!on) return { start };
  const captions = SCRIPT.slice(0, step + 1).flatMap((s) => (s.caption ? [s.caption] : []));
  return {
    start,
    voice: {
      state: SCRIPT[step].state,
      level: muted && SCRIPT[step].state === 'listening' ? 0 : level,
      captions,
      muted,
      onToggleMute: () => setMuted((m) => !m),
      onEnd: () => setOn(false)
    }
  };
}
