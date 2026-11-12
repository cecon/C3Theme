import TextField from '@mui/material/TextField';
import type { FieldInputProps } from './FieldInput';

/** Stable wire format independent of the keyboard's display language. */
export function shortcutKey(event: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'altKey' | 'shiftKey' | 'metaKey'>): string | undefined {
  if (['Control', 'Alt', 'Shift', 'Meta', 'Tab', 'Escape'].includes(event.key)) return;
  if (!event.ctrlKey && !event.altKey && !event.metaKey) return;
  return [
    event.ctrlKey && 'Ctrl',
    event.altKey && 'Alt',
    event.shiftKey && 'Shift',
    event.metaKey && 'Meta',
    event.key === ' ' ? 'Space' : event.key.toUpperCase()
  ]
    .filter(Boolean)
    .join('+');
}

export default function ShortcutInput({ value, onChange, error, readOnly, required, label }: FieldInputProps & { label: string }) {
  return (
    <TextField
      fullWidth
      label={label}
      value={String(value ?? '')}
      error={Boolean(error)}
      required={required}
      helperText={error ?? 'Pressione uma combinação com Ctrl, Alt ou Meta. Delete limpa.'}
      slotProps={{ input: { readOnly: true } }}
      onKeyDown={(e) => {
        if (readOnly || e.key === 'Tab' || e.key === 'Escape') return;
        e.preventDefault();
        const key = shortcutKey(e);
        if (key) onChange(key);
        else if (e.key === 'Delete' || e.key === 'Backspace') onChange('');
      }}
    />
  );
}
