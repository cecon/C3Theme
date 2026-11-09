import { useCallback, useEffect, useRef, useState } from 'react';

const EDGE = 24;

/** Máscara que esmaece as bordas de cima e de baixo só onde ainda há o que rolar. */
export function fadeMask(top: boolean, bottom: boolean): string | undefined {
  if (!top && !bottom) return undefined;
  const start = top ? `transparent 0, #000 ${EDGE}px` : '#000 0';
  const end = bottom ? `#000 calc(100% - ${EDGE}px), transparent 100%` : '#000 100%';
  return `linear-gradient(to bottom, ${start}, ${end})`;
}

/**
 * Lista que rola com as bordas esmaecendo: devolve o `ref` do contêiner e a máscara para o `sx`. Recalcula ao rolar
 * e quando o tamanho muda (itens entrando ou saindo, janela redimensionada).
 */
export default function useScrollFade<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [edges, setEdges] = useState({ top: false, bottom: false });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const top = el.scrollTop > 1;
    const bottom = el.scrollTop + el.clientHeight < el.scrollHeight - 1;
    setEdges((prev) => (prev.top === top && prev.bottom === bottom ? prev : { top, bottom }));
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    measure();
    el.addEventListener('scroll', measure, { passive: true });
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(measure);
    observer?.observe(el);
    for (const child of Array.from(el.children)) observer?.observe(child);
    return () => {
      el.removeEventListener('scroll', measure);
      observer?.disconnect();
    };
  }, [measure]);

  const mask = fadeMask(edges.top, edges.bottom);
  return { ref, maskSx: mask ? { maskImage: mask, WebkitMaskImage: mask } : {} };
}
