import { useEffect, useRef, type MouseEvent, type PointerEvent } from 'react';

import type { WireRecord } from '../types';

/** As opções entre `from` e `to` (inclusive), na ordem da tela; `undefined` se uma delas não está à vista. */
export function rangeBetween(list: WireRecord[], from: string | undefined, to: string): WireRecord[] | undefined {
  const a = list.findIndex((o) => o.id === from);
  const b = list.findIndex((o) => o.id === to);
  if (a < 0 || b < 0) return undefined;
  return list.slice(Math.min(a, b), Math.max(a, b) + 1);
}

/**
 * Marcar vários de uma vez no checklist (#11). Shift+clique aplica o estado da caixa clicada a todas entre ela e a
 * última clicada, na ordem que a lista mostra (já filtrada pela busca). Apertar o botão numa caixa e passar por cima
 * das outras aplica a elas o estado que a primeira vai ter. Quem respeita o `maxItems` é o `toggle`.
 */
export default function useChecklistGestures() {
  const anchor = useRef<string>(undefined);
  const shift = useRef(false);
  const drag = useRef<{ start: WireRecord; on: boolean; moved: boolean } | null>(null);
  // soltar o botão de volta na primeira caixa depois de arrastar dispara o clique dela: não desfaz o arraste
  const dragged = useRef(false);

  useEffect(() => {
    const end = () => {
      dragged.current = Boolean(drag.current?.moved);
      drag.current = null;
      setTimeout(() => (dragged.current = false));
    };
    window.addEventListener('pointerup', end);
    return () => window.removeEventListener('pointerup', end);
  }, []);

  /** Liga os gestos à lista desta renderização: `shown` na ordem da tela, `toggle` marca ou desmarca. */
  return (shown: WireRecord[], isOn: (o: WireRecord) => boolean, toggle: (options: WireRecord[], on: boolean) => void) => {
    const box = (o: WireRecord) => ({
      onClick: (e: MouseEvent) => {
        shift.current = e.shiftKey;
      },
      onChange: (on: boolean) => {
        if (dragged.current) return;
        const range = shift.current ? rangeBetween(shown, anchor.current, o.id!) : undefined;
        shift.current = false;
        anchor.current = o.id;
        toggle(range ?? [o], on);
      },
      onPointerDown: (e: PointerEvent) => {
        if (e.button === 0) drag.current = { start: o, on: !isOn(o), moved: false };
      }
    });

    /** Na linha: o arraste passou por ela. */
    const enter = (o: WireRecord) => {
      const d = drag.current;
      if (!d || d.start.id === o.id) return;
      const options = [...(d.moved ? [] : [d.start]), o].filter((x) => isOn(x) !== d.on);
      d.moved = true;
      anchor.current = o.id;
      if (options.length) toggle(options, d.on);
    };

    return { box, enter };
  };
}
