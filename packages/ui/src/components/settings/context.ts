import { createContext, useContext } from 'react';

/** O que o grupo passa às linhas: se as linhas `dependent` ficam desligadas (switch principal do grupo desligado). */
export const SettingsGroupContext = createContext<{ dependentsDisabled: boolean }>({ dependentsDisabled: false });

export interface SettingsRowState {
  /** id do rótulo da linha: vai no `aria-labelledby` do controle */
  labelId: string;
  /** id da explicação, quando há: vai no `aria-describedby` do controle */
  descriptionId?: string;
  disabled: boolean;
}

export const SettingsRowContext = createContext<SettingsRowState | null>(null);

/**
 * Ids e estado da linha em que o controle está. Os controles prontos (SettingsSwitch, SettingsSelect...) usam isto;
 * um controle próprio usa para ligar rótulo e explicação ao seu elemento.
 */
export function useSettingsRow(): SettingsRowState {
  const row = useContext(SettingsRowContext);
  if (!row) throw new Error('useSettingsRow: o controle precisa estar dentro de um SettingsRow.');
  return row;
}

/** Fonte do sistema (Mac: San Francisco; Windows: Segoe UI), para app desktop que quer parecer nativo. */
export const SYSTEM_FONT_STACK = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, Roboto, sans-serif';

/** Texto de linha desligada: esmaecido como o controle (WCAG dispensa contraste de componente inativo). */
export const DISABLED_OPACITY = 0.5;
