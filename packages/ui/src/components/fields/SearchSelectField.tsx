import { useEffect, useRef, useState } from 'react';

// material-ui
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';

// third-party
import { Add } from 'iconsax-reactjs';

import { useUiText } from '../../i18n';
import { withHint } from './HintButton';
import type { BaseFieldProps, TextLikeProps } from './types';

/** Opção com rótulo em texto: é o que aparece digitado na caixa. */
export interface SearchOption<V extends string | number = string | number> {
  value: V;
  label: string;
  disabled?: boolean;
}

type Common<V extends string | number> = Omit<BaseFieldProps<never>, 'value' | 'onChange'> &
  TextLikeProps & {
    options: SearchOption<V>[];
    /**
     * Busca no servidor: recebe o texto digitado (com espera de 250 ms) e o chamador troca `options` pelo resultado.
     * Sem ela, filtra as `options` na tela, sem diferenciar acento e maiúscula.
     */
    onSearch?: (text: string) => void;
    loading?: boolean;
    /** Rótulos dos valores escolhidos que podem não estar em `options` (busca no servidor, registro já gravado). */
    selected?: SearchOption<V>[];
    /** Última opção da lista: cadastrar o que foi digitado. */
    onCreate?: (text: string) => void;
    createLabel?: (text: string) => string;
  };

export type SearchSelectFieldProps<V extends string | number> = Common<V> &
  (
    | { multiple?: false; value: V | null; onChange: (value: V | null, option: SearchOption<V> | null) => void }
    | { multiple: true; value: V[]; onChange: (value: V[], options: SearchOption<V>[]) => void }
  );

const CREATE = { value: '\u0000c3-new', label: '' } as SearchOption<never>;
const localFilter = createFilterOptions<SearchOption>({ ignoreAccents: true, ignoreCase: true });

/**
 * Seleção com busca, de um ou de vários (`multiple`). Filtra na tela por padrão; com `onSearch`, a busca é do
 * chamador (o reference do motor usa assim). Grava o `value` das opções; o rótulo vem de `options` ou `selected`.
 */
export default function SearchSelectField<V extends string | number>(props: SearchSelectFieldProps<V>) {
  const { label, error, helperText, hint, required, disabled, readOnly, name, fullWidth = true, sx } = props;
  const { options, onSearch, loading, selected = [], onCreate, createLabel, placeholder, size, autoFocus, onBlur } = props;
  const t = useUiText();
  const [input, setInput] = useState('');
  const search = useRef(onSearch);
  search.current = onSearch;

  useEffect(() => {
    if (!search.current) return;
    const timer = setTimeout(() => search.current?.(input), 250);
    return () => clearTimeout(timer);
  }, [input]);

  // rótulo de cada valor: o que veio da busca vale mais que o guardado
  const known = new Map<V, SearchOption<V>>();
  for (const o of [...selected, ...options]) known.set(o.value, o);
  const toOption = (v: V) => known.get(v) ?? { value: v, label: String(v) };
  const current = props.multiple ? props.value.map(toOption) : props.value === null ? null : toOption(props.value);

  const typed = input.trim();
  const createText = createLabel ? createLabel(typed) : t('c3.select.create', { text: typed });
  const list = onCreate && !loading ? [...options, CREATE as SearchOption<V>] : options;

  const change = (v: SearchOption<V> | SearchOption<V>[] | null) => {
    if (Array.isArray(v)) {
      if (v.includes(CREATE)) return onCreate?.(typed);
      if (props.multiple)
        props.onChange(
          v.map((o) => o.value),
          v
        );
      return;
    }
    if (v === CREATE) return onCreate?.(typed);
    if (!props.multiple) props.onChange(v ? v.value : null, v);
  };

  return (
    <Autocomplete<SearchOption<V>, boolean>
      multiple={props.multiple}
      value={current}
      options={list}
      loading={loading}
      disabled={disabled}
      readOnly={readOnly}
      fullWidth={fullWidth}
      sx={sx}
      filterOptions={(opts, state) => {
        if (onSearch) return opts;
        const found = localFilter(
          opts.filter((o) => o !== CREATE),
          state as never
        ) as SearchOption<V>[];
        return opts.includes(CREATE) ? [...found, CREATE as SearchOption<V>] : found;
      }}
      getOptionLabel={(o) => (o === CREATE ? createText : o.label)}
      getOptionDisabled={(o) => Boolean(o.disabled)}
      isOptionEqualToValue={(a, b) => a.value === b.value}
      onChange={(_, v) => change(v as SearchOption<V> | SearchOption<V>[] | null)}
      onInputChange={(_, v, reason) => reason === 'input' && setInput(v)}
      onBlur={onBlur}
      renderOption={({ key, ...li }, o) =>
        o === CREATE ? (
          <Box component="li" key={key} {...li} sx={{ gap: 1, color: 'primary.main' }}>
            <Add size={16} />
            {createText}
          </Box>
        ) : (
          <li key={key} {...li}>
            {o.label}
          </li>
        )
      }
      noOptionsText={t('c3.select.empty')}
      loadingText={t('c3.select.loading')}
      renderInput={(params) => (
        <TextField
          {...params}
          {...{ name, placeholder, size, autoFocus, required }}
          label={withHint(label, hint)}
          error={Boolean(error)}
          helperText={error ?? helperText}
          slotProps={{
            ...params.slotProps,
            input: {
              ...params.slotProps.input,
              endAdornment: (
                <>
                  {loading && <CircularProgress color="inherit" size={18} />}
                  {params.slotProps.input.endAdornment}
                </>
              )
            }
          }}
        />
      )}
    />
  );
}
