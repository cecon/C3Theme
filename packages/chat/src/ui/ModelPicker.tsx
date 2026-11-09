import { useEffect } from 'react';

// material-ui
import Box from '@mui/material/Box';

import { fallbackModels, keepFallback, type ModelGroup } from '../core/models';
import ModelSelect from './ModelSelect';
import { useChatText } from './text';

export interface ModelFallback {
  value: string | null;
  onChange: (value: string | null) => void;
  /** Rótulo do segundo seletor. Padrão: "Se este falhar, usar". */
  label?: string;
}

export interface ModelPickerProps {
  /** Modelos por provedor, como o programa de IA instalado devolve. */
  groups: ModelGroup[];
  value: string | null;
  onChange: (value: string) => void;
  /** Padrão: "Modelo". */
  label?: string;
  /** `composer` (padrão): botão da barra da caixa de mensagem. `field`: campo de formulário. */
  variant?: 'composer' | 'field';
  size?: 'small' | 'medium';
  placeholder?: string;
  disabled?: boolean;
  /**
   * Modelo reserva ("Se este falhar, usar"): um segundo seletor sem o principal e sem os indisponíveis, com a
   * opção "Sem reserva". Quando o principal muda e vira o reserva, ou o reserva fica indisponível, ele é limpo
   * (`onChange(null)`); nos outros casos, é mantido.
   */
  fallback?: ModelFallback;
}

/**
 * Seletor de modelo de IA: grupos por provedor com o estado de cada um, etiquetas (Grátis, Local, Precisa entrar e
 * livres), busca sem acento e opções indisponíveis com o motivo. Teclado: setas, digitar para buscar, Enter. Não
 * sabe de provedor nenhum: a lista entra por `groups`. Para listas curtas sem busca (modo, esforço), use o
 * `ComposerSelect`.
 */
export default function ModelPicker(props: ModelPickerProps) {
  const { groups, value, onChange, label, variant = 'composer', size = 'small', placeholder, disabled, fallback } = props;
  const t = useChatText();
  const kept = fallback ? keepFallback(groups, value, fallback.value) : null;
  const stale = !!fallback && kept !== fallback.value;
  const onFallback = fallback?.onChange;

  useEffect(() => {
    if (stale) onFallback?.(kept);
  }, [stale, kept, onFallback]);

  const primary = (
    <ModelSelect
      groups={groups}
      value={value}
      onChange={(v) => v !== null && onChange(v)}
      label={label ?? t('c3.chat.model')}
      variant={variant}
      size={size}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
  if (!fallback) return primary;

  const composer = variant === 'composer';
  return (
    <Box
      sx={
        composer
          ? { display: 'inline-flex', alignItems: 'center', minWidth: 0 }
          : { display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }
      }
    >
      {primary}
      <ModelSelect
        groups={fallbackModels(groups, value)}
        value={kept}
        onChange={fallback.onChange}
        label={fallback.label ?? t('c3.chat.fallbackModel')}
        caption={composer ? t('c3.chat.fallbackShort') : undefined}
        noneLabel={t('c3.chat.noFallback')}
        variant={variant}
        size={size}
        disabled={disabled || value === null}
      />
    </Box>
  );
}
