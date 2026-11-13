import { useCallback, useEffect, useRef, useState } from 'react';

/** Busca somente dentro deste modal; ids declarados nunca entram num seletor CSS. */
export default function useSettingsFocus(open: boolean) {
  const panel = useRef<HTMLDivElement>(null);
  const openers = useRef<string[]>([]);
  const [target, setTarget] = useState<{ id: string }>();
  useEffect(() => {
    if (!open || !target) return;
    const timer = window.setTimeout(() => {
      const row = Array.from(panel.current?.querySelectorAll<HTMLElement>('[data-settings-row]') ?? []).find(
        (element) => element.dataset.settingsRow === target.id
      );
      row?.scrollIntoView?.({ block: 'center' });
      const control = row?.querySelector<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), [role="combobox"], [tabindex="0"]'
      );
      if (control) control.focus();
      else if (row) {
        row.tabIndex = -1;
        row.focus();
      } else {
        panel.current?.focus();
      }
    }, 0);
    const clear = window.setTimeout(() => setTarget(undefined), 2500);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(clear);
    };
  }, [open, target]);
  const focusRow = useCallback((id: string) => setTarget({ id }), []);
  return { panel, openers, highlight: target?.id, focusRow };
}
