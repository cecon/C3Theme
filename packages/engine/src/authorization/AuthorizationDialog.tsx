// Diálogo da autorização de outro usuário (#48): a mensagem do servidor, os campos do `app.authorization` (senha
// mascarada) e Autorizar / Cancelar. A recusa da tentativa anterior aparece aqui mesmo.
import { useEffect, useState } from 'react';

// material-ui
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';

import { ActionDialog } from '@c3theme/ui';
import { useText } from '../context';
import type { Text } from '../types';
import type { AuthorizationRequest } from './fetch';

export interface AuthorizationField {
  name: string;
  label: Text;
  type?: 'string' | 'password' | 'text';
  minLength?: number;
}

export interface AuthorizationConfig {
  /** Códigos de erro do servidor que pedem a autorização. */
  codes: string[];
  title?: Text;
  fields: AuthorizationField[];
}

export interface AuthorizationDialogProps {
  config: AuthorizationConfig;
  /** Pedido aberto; `null` fecha. */
  request: AuthorizationRequest | null;
  onSubmit: (values: Record<string, string>) => void;
  onCancel: () => void;
}

export default function AuthorizationDialog({ config, request, onSubmit, onCancel }: AuthorizationDialogProps) {
  const text = useText();
  const [values, setValues] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  // pedido novo (ou nova recusa): a senha nunca fica; o resto continua para corrigir
  useEffect(() => {
    setSent(false);
    setValues((v) => Object.fromEntries(config.fields.filter((f) => f.type !== 'password').map((f) => [f.name, v[f.name] ?? ''])));
  }, [request, config]);
  const short = (f: AuthorizationField) => (values[f.name] ?? '').trim().length < Math.max(1, f.minLength ?? 1);
  const invalid = config.fields.some(short);

  return (
    <ActionDialog
      open={request !== null}
      title={text(config.title ?? 'Autorização')}
      description={request?.message}
      confirmLabel="Autorizar"
      backLabel="Cancelar"
      error={request?.error}
      loading={sent}
      dirty
      onClose={onCancel}
      onConfirm={() => {
        if (invalid) return;
        setSent(true);
        onSubmit(Object.fromEntries(config.fields.map((f) => [f.name, (values[f.name] ?? '').trim()])));
      }}
    >
      <Stack spacing={2}>
        {config.fields.map((f, i) => (
          <TextField
            key={f.name}
            label={text(f.label)}
            type={f.type === 'password' ? 'password' : 'text'}
            multiline={f.type === 'text'}
            minRows={f.type === 'text' ? 2 : undefined}
            required
            autoFocus={i === 0}
            autoComplete={f.type === 'password' ? 'off' : undefined}
            value={values[f.name] ?? ''}
            onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
            helperText={f.minLength ? `Pelo menos ${f.minLength} caracteres.` : undefined}
          />
        ))}
      </Stack>
    </ActionDialog>
  );
}
