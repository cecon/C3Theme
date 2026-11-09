import { useState } from 'react';
import type { ReactNode } from 'react';

// material-ui
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';

// third-party
import { Eye, EyeSlash } from 'iconsax-reactjs';

import { useText } from '../context';
import type { FieldInputProps } from './FieldInput';

/**
 * Campo só de escrita (`writeOnly`: senha, PIN). O valor gravado nunca chega à shell: no detalhe aparece
 * "não exibida"; na edição o campo começa vazio, e vazio mantém o que está gravado.
 */
export default function PasswordInput({
  field,
  value,
  onChange,
  error,
  required,
  readOnly,
  existing,
  label
}: FieldInputProps & { label: ReactNode }) {
  const text = useText();
  const [shown, setShown] = useState(false);
  // textos da shell com chave de tradução; o defaultMessage é o português
  const t = (id: string, defaultMessage: string) => text({ id: `c3.password.${id}`, defaultMessage });

  if (readOnly) {
    return <TextField label={label} value={t('hidden', 'Não exibida')} fullWidth disabled slotProps={{ input: { readOnly: true } }} />;
  }

  const keep = existing ? t('keep', 'Deixe em branco para manter a atual.') : undefined;
  const help = [field.help ? text(field.help) : undefined, keep].filter(Boolean).join(' ');
  return (
    <TextField
      label={label}
      required={required}
      fullWidth
      type={shown ? 'text' : 'password'}
      value={(value ?? '') as string}
      onChange={(e) => onChange(e.target.value)}
      error={Boolean(error)}
      helperText={error ?? (help || undefined)}
      // não deixa o navegador preencher com a senha de quem está logado
      autoComplete="new-password"
      slotProps={{
        htmlInput: { maxLength: field.maxLength },
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <Tooltip title={shown ? t('hide', 'Ocultar') : t('show', 'Mostrar')}>
                <IconButton
                  edge="end"
                  onClick={() => setShown((s) => !s)}
                  aria-label={shown ? t('hideLabel', 'Ocultar senha') : t('showLabel', 'Mostrar senha')}
                >
                  {shown ? <EyeSlash size={18} /> : <Eye size={18} />}
                </IconButton>
              </Tooltip>
            </InputAdornment>
          )
        }
      }}
    />
  );
}
