// Atalho de teclado (`format: "shortcut"` em string, #110). Mesma regra no backend; casos em
// spec/v0/conformance/documents.json. Trafega na forma canônica: modificadores na ordem Ctrl, Alt, Shift, Meta, e a
// tecla no fim, unidos por "+" ("Ctrl+Shift+K", "F5"). Sem modificador, só as teclas de função.

export const MODIFIERS = ['Ctrl', 'Alt', 'Shift', 'Meta'];
const NAMED = [
  'Space',
  'Enter',
  'Tab',
  'Backspace',
  'Delete',
  'Insert',
  'Home',
  'End',
  'PageUp',
  'PageDown',
  'Up',
  'Down',
  'Left',
  'Right',
  'Plus',
  'Minus',
  'Comma',
  'Period',
  'Slash'
];
const FUNCTION = /^F([1-9]|1\d|2[0-4])$/;

/** null = válido; 'pattern' = fora da forma canônica. */
export function shortcutError(value) {
  const parts = value.split('+');
  const key = parts.pop();
  let last = -1;
  for (const m of parts) {
    const i = MODIFIERS.indexOf(m);
    if (i <= last) return 'pattern';
    last = i;
  }
  const fn = FUNCTION.test(key);
  if (!fn && !/^[A-Z0-9]$/.test(key) && !NAMED.includes(key)) return 'pattern';
  return parts.length > 0 || fn ? null : 'pattern';
}

const KEY_NAMES = {
  ' ': 'Space',
  ArrowUp: 'Up',
  ArrowDown: 'Down',
  ArrowLeft: 'Left',
  ArrowRight: 'Right',
  '+': 'Plus',
  '-': 'Minus',
  ',': 'Comma',
  '.': 'Period',
  '/': 'Slash'
};

/**
 * Tecla apertada → atalho canônico; `undefined` enquanto só há modificador ou para tecla que não vira atalho. Usa o
 * `code` (KeyK, Digit1) para letras e números, então Shift+1 continua "Shift+1" em qualquer teclado.
 */
export function shortcutFromKey(e) {
  const code = /^Key([A-Z])$/.exec(e.code ?? '')?.[1] ?? /^Digit(\d)$/.exec(e.code ?? '')?.[1];
  const key = code ?? KEY_NAMES[e.key] ?? (e.key?.length === 1 ? e.key.toUpperCase() : e.key);
  const mods = [e.ctrlKey && 'Ctrl', e.altKey && 'Alt', e.shiftKey && 'Shift', e.metaKey && 'Meta'].filter(Boolean);
  const value = [...mods, key].join('+');
  return shortcutError(value) === null ? value : undefined;
}

/** Atalho para ler: no Mac, os símbolos (⌃⌥⇧⌘); nos outros, como trafega. */
export function shortcutLabel(value, mac = false) {
  if (!mac) return value;
  const sym = { Ctrl: '⌃', Alt: '⌥', Shift: '⇧', Meta: '⌘' };
  return value
    .split('+')
    .map((p) => sym[p] ?? p)
    .join('');
}
