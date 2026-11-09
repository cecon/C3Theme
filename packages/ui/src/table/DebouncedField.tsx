import { useEffect, useState } from 'react';

// material-ui
import TextField from '@mui/material/TextField';
import type { TextFieldProps } from '@mui/material/TextField';

export type DebouncedFieldProps = Omit<TextFieldProps, 'value' | 'onChange'> & {
  value: string;
  onChange: (value: string) => void;
  /** Espera em ms antes de avisar a mudança. */
  delay?: number;
};

/** Campo de texto que só avisa a mudança depois de uma pausa na digitação (filtros e busca). */
export default function DebouncedField({ value, onChange, delay = 250, ...props }: DebouncedFieldProps) {
  const [local, setLocal] = useState(value);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  useEffect(() => {
    if (local === value) return;
    const timer = setTimeout(() => onChange(local), delay);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local]);

  return <TextField {...props} value={local} onChange={(e) => setLocal(e.target.value)} />;
}
