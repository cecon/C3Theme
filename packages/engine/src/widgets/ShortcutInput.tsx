import { useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

// material-ui
import TextField from '@mui/material/TextField';

import { useEngine, useText } from '../context';
import { shortcutFromKey, shortcutLabel } from '../shortcut.mjs';
import type { FieldInputProps } from './FieldInput';

const isMac = () => typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

/**
 * Atalho de teclado (`format: "shortcut"`, #110): o campo captura a combinação apertada e grava na forma canônica
 * ("Ctrl+Shift+K"). Tab sai do campo, Backspace ou Delete sozinhos limpam, e o atalho que outro campo do mesmo
 * registro já usa é recusado na hora, com o nome do campo; o backend confere de novo ao gravar.
 */
export default function ShortcutInput({
  field,
  value,
  onChange,
  error,
  required,
  record,
  entity,
  label
}: FieldInputProps & { label: ReactNode }) {
  const { entities } = useEngine();
  const text = useText();
  const [taken, setTaken] = useState<string>();
  const current = typeof value === 'string' ? value : '';
  const others = (entity ? entities[entity]?.def.fields : [])?.filter((f) => f.format === 'shortcut' && f.name !== field.name) ?? [];

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const bare = !e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey;
    if (e.key === 'Tab' && bare) return;
    e.preventDefault();
    if (bare && (e.key === 'Backspace' || e.key === 'Delete')) {
      setTaken(undefined);
      return onChange(null);
    }
    const next = shortcutFromKey(e);
    if (!next) return;
    const owner = others.find((f) => record?.[f.name] === next);
    if (owner) return setTaken(`${next} já é o atalho de ${text(owner.label, owner.name)}.`);
    setTaken(undefined);
    onChange(next);
  };

  return (
    <TextField
      label={label}
      required={required}
      fullWidth
      value={current ? shortcutLabel(current, isMac()) : ''}
      placeholder="Aperte a combinação de teclas"
      onKeyDown={onKeyDown}
      error={Boolean(error ?? taken)}
      helperText={error ?? taken ?? (field.help ? text(field.help) : 'Backspace limpa.')}
      slotProps={{ htmlInput: { readOnly: true, 'aria-roledescription': 'campo de atalho', spellCheck: false } }}
    />
  );
}
