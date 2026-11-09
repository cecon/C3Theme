import { useEffect, useId, useMemo, useState, type KeyboardEvent } from 'react';

// material-ui
import Box from '@mui/material/Box';
import InputAdornment from '@mui/material/InputAdornment';
import Popover from '@mui/material/Popover';
import TextField from '@mui/material/TextField';

// third-party
import { ArrowDown2, SearchNormal1 } from 'iconsax-reactjs';

import { filterModels, findModel, selectableValues, stepModel, type ModelGroup } from '../core/models';
import ModelList from './ModelList';
import ModelTags from './ModelTags';
import SelectButton from './SelectButton';
import { useChatText } from './text';

/** Valor da opção "nenhum" (só no seletor do reserva). */
const NONE = '\u0000none';
const srOnly = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' } as const;

export interface ModelSelectProps {
  groups: ModelGroup[];
  value: string | null;
  onChange: (value: string | null) => void;
  label: string;
  /** `composer`: botão compacto da barra da caixa de mensagem. `field`: campo de formulário com o rótulo na borda. */
  variant: 'composer' | 'field';
  size: 'small' | 'medium';
  /** Texto da opção que limpa a escolha ("Sem reserva"). Sem ele, não há como limpar. */
  noneLabel?: string;
  /** Texto apagado antes do valor no botão ("Reserva"). */
  caption?: string;
  placeholder?: string;
  disabled?: boolean;
}

const opensOn = (e: KeyboardEvent) => ['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key);
const typedChar = (e: KeyboardEvent) => e.key.length === 1 && e.key !== ' ' && !e.ctrlKey && !e.metaKey && !e.altKey;

/** Gatilho + janela de busca e lista do seletor de modelo. Use pelo `ModelPicker`. */
export default function ModelSelect(props: ModelSelectProps) {
  const { groups, value, onChange, label, variant, size, noneLabel, caption, placeholder, disabled } = props;
  const t = useChatText();
  const uid = useId();
  const listId = `${uid}-list`;
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<string | null>(null);

  const shown = useMemo(() => {
    const found = filterModels(groups, query);
    if (!noneLabel || query.trim()) return found;
    return [{ id: NONE, label: '', options: [{ value: NONE, label: noneLabel }] }, ...found];
  }, [groups, query, noneLabel]);
  const values = useMemo(() => selectableValues(shown), [shown]);
  const index = useMemo(() => new Map(shown.flatMap((g) => g.options).map((o, i) => [o.value, `${uid}-o${i}`])), [shown, uid]);
  const optionId = (v: string) => index.get(v) ?? '';
  const current = findModel(groups, value);
  const shownValue = value ?? (noneLabel ? NONE : null);

  const open = (el: HTMLElement, seed = '') => {
    setQuery(seed);
    setActive(seed ? null : shownValue);
    setAnchor(el);
  };
  const close = () => setAnchor(null);
  const pick = (v: string) => {
    close();
    const next = v === NONE ? null : v;
    if (next !== value) onChange(next);
  };

  // Ao digitar, a primeira opção que casa vira a ativa; a ativa sempre fica à vista.
  useEffect(() => {
    if (anchor && (active === null || !values.includes(active))) setActive(values[0] ?? null);
  }, [anchor, values, active]);
  useEffect(() => {
    if (active) document.getElementById(index.get(active) ?? '')?.scrollIntoView?.({ block: 'nearest' });
  }, [active, index]);

  const onTriggerKey = (e: KeyboardEvent<HTMLElement>) => {
    if (opensOn(e) || typedChar(e)) {
      e.preventDefault();
      open(e.currentTarget, typedChar(e) ? e.key : '');
    }
  };
  const onSearchKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(stepModel(values, active, e.key === 'ArrowDown' ? 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (active) pick(active);
    }
  };

  const chosen = current?.option.label ?? (value === null ? noneLabel : undefined);
  const valueText = chosen ?? placeholder ?? t('c3.chat.chooseModel');
  const popup = { 'aria-haspopup': 'dialog' as const, 'aria-expanded': !!anchor, 'aria-controls': anchor ? `${uid}-popup` : undefined };
  const tags = current && <ModelTags flags={current.option.flags} tags={current.option.tags} />;
  const composer = variant === 'composer';

  return (
    <>
      {composer ? (
        <SelectButton
          {...popup}
          size={size}
          disabled={disabled}
          srLabel={caption ? undefined : `${label}:`}
          caption={caption}
          value={valueText}
          badge={tags}
          onClick={(e) => open(e.currentTarget)}
          onKeyDown={onTriggerKey}
        />
      ) : (
        <TextField
          label={label}
          size={size}
          fullWidth
          disabled={disabled}
          value={chosen ?? ''}
          placeholder={placeholder ?? t('c3.chat.chooseModel')}
          onClick={(e) => !disabled && open(e.currentTarget as HTMLElement)}
          onKeyDown={onTriggerKey}
          slotProps={{
            inputLabel: { shrink: true },
            htmlInput: { role: 'combobox', ...popup, readOnly: true, style: { cursor: 'pointer' } },
            input: {
              endAdornment: (
                <InputAdornment position="end" sx={{ gap: 1 }}>
                  {tags}
                  <ArrowDown2 size={14} aria-hidden />
                </InputAdornment>
              )
            }
          }}
        />
      )}
      <Popover
        open={!!anchor}
        anchorEl={anchor}
        onClose={close}
        anchorOrigin={composer ? { vertical: 'top', horizontal: 'left' } : { vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={composer ? { vertical: 'bottom', horizontal: 'left' } : { vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            id: `${uid}-popup`,
            role: 'dialog',
            'aria-label': label,
            sx: { width: composer ? 360 : anchor?.offsetWidth, minWidth: 300, maxWidth: 'calc(100vw - 32px)', mt: composer ? -0.5 : 0.5 }
          }
        }}
      >
        <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
          <TextField
            autoFocus
            fullWidth
            size="small"
            value={query}
            placeholder={t('c3.chat.searchModels')}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onSearchKey}
            slotProps={{
              htmlInput: {
                role: 'combobox',
                'aria-label': t('c3.chat.searchModels'),
                'aria-expanded': shown.length > 0,
                'aria-controls': shown.length ? listId : undefined,
                'aria-activedescendant': active ? optionId(active) : undefined,
                'aria-autocomplete': 'list'
              },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchNormal1 size={16} aria-hidden />
                  </InputAdornment>
                )
              }
            }}
          />
        </Box>
        {shown.length ? (
          <ModelList
            id={listId}
            label={label}
            groups={shown}
            value={shownValue}
            active={active}
            optionId={optionId}
            onPick={pick}
            onActive={setActive}
          />
        ) : (
          <Box sx={{ px: 2, py: 3, typography: 'body2', color: 'text.secondary', textAlign: 'center' }}>
            {t('c3.chat.noModels', { query: query.trim() })}
          </Box>
        )}
        {query.trim() && (
          <Box role="status" sx={srOnly}>
            {t('c3.chat.modelsFound', { count: shown.reduce((n, g) => n + g.options.length, 0) })}
          </Box>
        )}
      </Popover>
    </>
  );
}
