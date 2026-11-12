import { useState } from 'react';

// material-ui
import Autocomplete from '@mui/material/Autocomplete';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';

// third-party
import { SearchNormal1 } from 'iconsax-reactjs';

import { matchSettings, type SettingEntry } from '../../settingsSearch';

/** Busca das configurações: cada resultado mostra onde o ajuste mora; escolher leva até ele. */
export default function SettingsSearchBox({ entries, onPick }: { entries: SettingEntry[]; onPick: (e: SettingEntry) => void }) {
  const [input, setInput] = useState('');
  return (
    <Autocomplete
      options={entries}
      value={null}
      inputValue={input}
      onInputChange={(_, v, reason) => reason !== 'reset' && setInput(v)}
      onChange={(_, e) => {
        if (!e) return;
        setInput('');
        onPick(e);
      }}
      filterOptions={(all, s) => matchSettings(all, s.inputValue)}
      getOptionLabel={(e) => e.label}
      getOptionKey={(e) => e.field}
      isOptionEqualToValue={(a, b) => a.field === b.field}
      noOptionsText={input.trim() ? 'Nenhum ajuste encontrado.' : 'Digite o nome do ajuste.'}
      renderOption={({ key, ...props }, e) => (
        <li key={key} {...props}>
          <span>
            {e.label}
            {e.where && <span style={{ opacity: 0.65 }}> · {e.where}</span>}
          </span>
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="Buscar nas configurações"
          slotProps={{
            ...params.slotProps,
            htmlInput: { ...params.slotProps.htmlInput, 'aria-label': 'Buscar nas configurações' },
            input: {
              ...params.slotProps.input,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchNormal1 size={18} />
                </InputAdornment>
              )
            }
          }}
        />
      )}
    />
  );
}
