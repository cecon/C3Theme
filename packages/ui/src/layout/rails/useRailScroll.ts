import { useCallback, useEffect, useState, type DragEvent, type RefObject } from 'react';

/** Sombras são estado da rolagem; durante arraste a borda rola continuamente até sair ou soltar. */
export default function useRailScroll(ref: RefObject<HTMLDivElement | null>, count: number) {
  const [edge, setEdge] = useState({ top: false, bottom: false });
  const [speed, setSpeed] = useState(0);
  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const next = { top: el.scrollTop > 1, bottom: el.scrollTop + el.clientHeight < el.scrollHeight - 1 };
    setEdge((old) => (old.top === next.top && old.bottom === next.bottom ? old : next));
  }, [ref]);
  useEffect(() => {
    measure();
    const el = ref.current;
    if (!el) return;
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(measure);
    observer?.observe(el);
    return () => observer?.disconnect();
  }, [count, measure, ref]);
  useEffect(() => {
    if (!speed) return;
    const interval = setInterval(() => {
      if (ref.current) ref.current.scrollTop += speed;
      measure();
    }, 25);
    const stop = () => setSpeed(0);
    window.addEventListener('dragend', stop);
    window.addEventListener('drop', stop);
    return () => {
      clearInterval(interval);
      window.removeEventListener('dragend', stop);
      window.removeEventListener('drop', stop);
    };
  }, [speed, measure, ref]);
  return {
    measure,
    stop: () => setSpeed(0),
    dragOver: (event: DragEvent<HTMLDivElement>) => {
      const el = ref.current;
      if (!el) return;
      event.preventDefault();
      const bounds = el.getBoundingClientRect();
      setSpeed(event.clientY < bounds.top + 32 ? -12 : event.clientY > bounds.bottom - 32 ? 12 : 0);
    },
    shadow:
      [edge.top && 'inset 0 8px 8px -8px rgba(0,0,0,.5)', edge.bottom && 'inset 0 -8px 8px -8px rgba(0,0,0,.5)']
        .filter(Boolean)
        .join(', ') || 'none'
  };
}
