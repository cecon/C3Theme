import { useEffect, useState } from 'react';

/**
 * Hora atual que se atualiza a cada `everyMs` enquanto `active`. Um relógio só por lista (não um por item), e o
 * intervalo é limpo ao desligar ou desmontar.
 */
export function useNow(everyMs: number, active = true): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return undefined;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), everyMs);
    return () => clearInterval(timer);
  }, [everyMs, active]);
  return now;
}
