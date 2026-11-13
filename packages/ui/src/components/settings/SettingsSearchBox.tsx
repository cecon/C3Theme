import { useId, useState, type Ref } from 'react';

// material-ui
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import InputAdornment from '@mui/material/InputAdornment';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

// third-party
import { SearchNormal1 } from 'iconsax-reactjs';

import { useUiText } from '../../i18n';
import { rankSettings, type SettingsSearchEntry, type SettingsSearchHit } from './search';

export interface SettingsSearchBoxProps {
  /** linhas de todas as seções e subpáginas que a busca conhece */
  entries: readonly SettingsSearchEntry[];
  /** texto digitado (controlado pelo diálogo, que limpa com Escape antes de fechar) */
  value: string;
  onChange: (value: string) => void;
  /** escolher um resultado faz o diálogo abrir a seção/página e focar a linha */
  onPick: (hit: SettingsSearchHit) => void;
  /** Enter abre o primeiro resultado; sem resultado, não faz nada */
  onSubmit?: (hit: SettingsSearchHit) => void;
  placeholder?: string;
  /** máximo de resultados mostrados (o restante continua alcançável digitando mais) */
  limit?: number;
  /** rótulo do estado sem resultado */
  emptyLabel?: string;
  /** o diálogo foca a caixa ao abrir */
  inputRef?: Ref<HTMLInputElement>;
}

/**
 * Caixa de busca das configurações: filtra as linhas de todas as abas pelo título e pela descrição, mostra até
 * `limit` resultados com onde cada uma mora e quantos foram encontrados, e abre a primeira com Enter. Setas movem
 * o destaque; Enter escolhe o destacado. O foco e o Escape ficam com o diálogo.
 */
export default function SettingsSearchBox({
  entries,
  value,
  onChange,
  onPick,
  onSubmit,
  placeholder,
  limit = 8,
  emptyLabel,
  inputRef
}: SettingsSearchBoxProps) {
  const t = useUiText();
  const listId = useId();
  const countId = useId();
  const inputId = useId();
  const hits = rankSettings(entries, value, limit);
  const [choice, setChoice] = useState({ query: '', index: 0 });
  const selected = choice.query === value ? Math.min(choice.index, Math.max(0, hits.length - 1)) : 0;
  const typed = value.trim() !== '';
  const pick = (hit: SettingsSearchHit) => {
    onChange('');
    onPick(hit);
  };
  return (
    <Stack sx={{ px: 2.5, pt: 1.5, pb: 1, gap: 1 }}>
      <TextField
        id={inputId}
        inputRef={inputRef}
        size="small"
        fullWidth
        autoComplete="off"
        data-settings-search
        value={value}
        placeholder={placeholder ?? t('c3.settingsModal.search')}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && hits.length) {
            event.preventDefault();
            setChoice({ query: value, index: (selected + (event.key === 'ArrowDown' ? 1 : -1) + hits.length) % hits.length });
          }
          if (event.key === 'Enter') {
            event.preventDefault();
            const first = hits[selected];
            if (first !== undefined) {
              pick(first);
              onSubmit?.(first);
            }
          }
        }}
        slotProps={{
          htmlInput: {
            role: 'combobox',
            'aria-label': placeholder ?? t('c3.settingsModal.search'),
            'aria-expanded': typed,
            'aria-controls': listId,
            'aria-autocomplete': 'list',
            'aria-activedescendant': typed && hits.length ? `${listId}-${selected}` : undefined,
            'aria-describedby': typed ? countId : undefined
          },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchNormal1 size={18} />
              </InputAdornment>
            )
          }
        }}
      />
      {typed && (
        <>
          <Typography id={countId} variant="caption" color="text.secondary" aria-live="polite">
            {t('c3.settingsModal.results', { count: hits.length })}
          </Typography>
          {hits.length > 0 && (
            <Box
              id={listId}
              role="listbox"
              aria-label={t('c3.settingsModal.resultsLabel')}
              sx={{ maxHeight: 220, overflowY: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}
            >
              {hits.map((hit, index) => (
                <ButtonBase
                  key={`${hit.section}:${hit.page ?? ''}:${hit.id}`}
                  role="option"
                  id={`${listId}-${index}`}
                  aria-selected={index === selected}
                  onClick={() => pick(hit)}
                  sx={{ display: 'block', width: '100%', textAlign: 'left', px: 1.5, py: 0.75, justifyContent: 'flex-start' }}
                >
                  <ListItemText
                    primary={hit.title}
                    secondary={hit.where}
                    slotProps={{ primary: { variant: 'body2' }, secondary: { variant: 'caption' } }}
                  />
                </ButtonBase>
              ))}
            </Box>
          )}
          {hits.length === 0 && (
            <Box sx={{ px: 1, py: 2 }} role="status">
              <Typography variant="body2" color="text.secondary">
                {emptyLabel ?? t('c3.settingsModal.noResults')}
              </Typography>
            </Box>
          )}
        </>
      )}
    </Stack>
  );
}
