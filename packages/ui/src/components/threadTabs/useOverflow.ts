import { useCallback, useEffect, useRef, useState } from 'react';

/** Sobra de rolagem da faixa: há aba escondida à esquerda (`start`) ou à direita (`end`). */
export interface Overflow {
  start: boolean;
  end: boolean;
}

const NONE: Overflow = { start: false, end: false };

/** Mede a faixa ao rolar e ao mudar de tamanho; `scrollIntoView` traz uma aba à vista sem pular a página. */
export default function useOverflow(deps: unknown) {
  const ref = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState<Overflow>(NONE);
  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const next = { start: el.scrollLeft > 1, end: el.scrollLeft < max - 1 };
    setOverflow((o) => (o.start === next.start && o.end === next.end ? o : next));
  }, []);
  useEffect(() => {
    measure();
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure, deps]);
  const scrollIntoView = useCallback((id: string) => {
    const tab = ref.current?.querySelector<HTMLElement>(`[data-tab-id="${CSS.escape(id)}"]`);
    tab?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }, []);
  return { ref, overflow, measure, scrollIntoView };
}
