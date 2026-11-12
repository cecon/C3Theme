import { useEffect, useRef } from 'react';

import useColorMode, { ColorMode, ColorModePreference } from './useColorMode';

export interface ModeChange {
  /** O que a pessoa escolheu (`system` segue o sistema). */
  preference: ColorModePreference;
  /** O que está na tela, com `system` já resolvido. */
  mode: ColorMode;
}

export interface ModeBridgeProps {
  /** Modo pedido pelo app. Vale quando muda: a troca pelo painel continua livre e fica salva. */
  mode?: ColorModePreference;
  /** Avisa cada troca depois da abertura: pela casca, pelo app, por outra janela ou pelo sistema. */
  onModeChange?: (change: ModeChange) => void;
}

/**
 * Liga o modo claro/escuro ao código de fora da casca (#112) sem remontá-la: aplica `mode` pelo mesmo setter do
 * painel (que já salva a escolha) e avisa as trocas, sem o app conhecer a chave de armazenamento.
 */
export default function ModeBridge({ mode, onModeChange }: ModeBridgeProps) {
  const { mode: resolved, preference, setPreference } = useColorMode();

  const apply = useRef(setPreference);
  apply.current = setPreference;
  useEffect(() => {
    if (mode) apply.current(mode);
  }, [mode]);

  const notify = useRef(onModeChange);
  notify.current = onModeChange;
  const last = useRef<string | undefined>(undefined);
  useEffect(() => {
    const key = `${preference}:${resolved}`;
    const previous = last.current;
    last.current = key;
    if (previous !== undefined && previous !== key) notify.current?.({ preference, mode: resolved });
  }, [preference, resolved]);

  return null;
}
