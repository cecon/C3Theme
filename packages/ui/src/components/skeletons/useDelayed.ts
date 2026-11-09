import { useEffect, useState } from 'react';

/** Atraso padrão antes de mostrar um placeholder: carregamento mais rápido que isso não pisca na tela. */
export const SKELETON_DELAY = 200;

/**
 * Fica `true` só depois de `active` passar `delay` ms ligado, e volta a `false` assim que ele desliga.
 * Serve para não piscar placeholder em carregamentos rápidos (cache, rede local).
 */
export default function useDelayed(active: boolean, delay = SKELETON_DELAY): boolean {
  const [elapsed, setElapsed] = useState(false);
  useEffect(() => {
    if (delay <= 0) return;
    if (!active) {
      setElapsed(false);
      return;
    }
    const t = setTimeout(() => setElapsed(true), delay);
    return () => clearTimeout(t);
  }, [active, delay]);
  return active && (delay <= 0 || elapsed);
}
