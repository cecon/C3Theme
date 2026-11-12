import { useState } from 'react';
import type { ReactNode } from 'react';

// material-ui
import TextField from '@mui/material/TextField';

import { useText } from '../context';
import { documentError, documentKind, maskDocument, normalizeDocument } from '../documents.mjs';
import type { FieldInputProps } from './FieldInput';

const MASK = { cpf: '000.000.000-00', cnpj: '00.000.000/0000-00', phone: '(00) 00000-0000' };

/**
 * CPF/CNPJ/telefone (`format`): digita e mostra com máscara, grava sem ela (só dígitos e letras maiúsculas, como a
 * spec trafega). Confere o dígito verificador (ou o tamanho) ao sair do campo; o backend confere de novo ao salvar.
 */
export default function DocumentInput({ field, value, onChange, error, required, label }: FieldInputProps & { label: ReactNode }) {
  const text = useText();
  // textos da shell com chave de tradução; o defaultMessage é o português
  const t = (id: string, defaultMessage: string) => text({ id: `c3.document.${id}`, defaultMessage });
  const format = field.format as Exclude<NonNullable<typeof field.format>, 'shortcut'>;
  const [touched, setTouched] = useState(false);
  const raw = (value ?? '') as string;
  const local = touched && raw ? documentError(format, raw) : null;
  const kind =
    format === 'phone'
      ? t('phone', 'Telefone')
      : ((raw && documentKind(format, raw)) || (format === 'cpf_cnpj' ? t('document', 'documento') : format)).toUpperCase();
  const localMessage =
    local && `${kind} ${local === 'check_digit' ? t('checkDigit', 'inválido: confira os dígitos.') : t('incomplete', 'incompleto.')}`;
  const helper = error ?? localMessage ?? (field.help ? text(field.help) : undefined);

  return (
    <TextField
      label={label}
      required={required}
      fullWidth
      placeholder={format === 'cpf_cnpj' ? t('placeholder', 'CPF ou CNPJ') : MASK[format]}
      value={maskDocument(raw, format)}
      onChange={(e) => {
        setTouched(false);
        const max = format === 'cnpj' || format === 'cpf_cnpj' ? 14 : 11;
        const typed = format === 'phone' ? e.target.value.replace(/\D/g, '') : normalizeDocument(e.target.value);
        onChange(typed.slice(0, max) || null);
      }}
      onBlur={() => setTouched(true)}
      error={Boolean(error ?? local)}
      helperText={helper}
      // CNPJ alfanumérico tem letras: teclado de texto, sempre maiúsculo
      slotProps={{
        htmlInput: {
          inputMode: format === 'cpf' ? 'numeric' : format === 'phone' ? 'tel' : 'text',
          autoCapitalize: 'characters',
          spellCheck: false
        }
      }}
    />
  );
}
