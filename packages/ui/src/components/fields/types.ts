import type { ReactNode } from 'react';

import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Props comuns dos campos do @c3theme/ui: controlados, com o valor no formato que trafega (não o texto da tela).
 * `error` é a mensagem: pinta o campo e toma o lugar do `helperText`.
 */
export interface BaseFieldProps<V> {
  label: ReactNode;
  value: V;
  onChange: (value: V) => void;
  error?: string;
  helperText?: ReactNode;
  /**
   * Ajuda longa atrás de uma interrogação no campo (o que é, de onde vem, exemplo). O `helperText` fica para a frase
   * curta que todo mundo precisa ver; o `hint` para o que só quem tem dúvida abre.
   */
  hint?: ReactNode;
  required?: boolean;
  disabled?: boolean;
  /** Mostra o valor sem deixar alterar (diferente de `disabled`, continua legível e selecionável). */
  readOnly?: boolean;
  name?: string;
  /** Padrão: true, como nos formulários do motor. */
  fullWidth?: boolean;
  sx?: SxProps<Theme>;
}

/** Extras dos campos de digitação. */
export interface TextLikeProps {
  placeholder?: string;
  size?: 'small' | 'medium';
  autoFocus?: boolean;
  onBlur?: () => void;
}

/** Opção de seleção e rádio: `value` é o que grava, `label` o que a tela mostra. */
export interface FieldOption<V extends string | number = string | number> {
  value: V;
  label: ReactNode;
  disabled?: boolean;
}
