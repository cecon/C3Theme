// Autocomplete: múltiplo, checkboxes, fixos e criar opção.
import { useState } from 'react';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import { CITIES, City, SKILLS } from '../../data';

export const byName = [...CITIES].sort((a, b) => a.region.localeCompare(b.region) || a.name.localeCompare(b.name));
export const cityLabel = (c: City) => `${c.name} – ${c.uf}`;

export function MultipleDemo() {
  const [value, setValue] = useState<string[]>(['React', 'TypeScript']);
  return (
    <Autocomplete
      multiple
      options={SKILLS}
      value={value}
      onChange={(_, v) => setValue(v)}
      renderInput={(params) => <TextField {...params} label="Habilidades" placeholder="Adicionar" />}
    />
  );
}

export function CheckboxesDemo() {
  return (
    <Autocomplete
      multiple
      disableCloseOnSelect
      options={SKILLS}
      defaultValue={['Figma']}
      renderOption={(props, option, { selected }) => {
        const { key, ...rest } = props;
        return (
          <li key={key} {...rest}>
            <Checkbox size="small" checked={selected} sx={{ mr: 1, p: 0.5 }} />
            {option}
          </li>
        );
      }}
      renderInput={(params) => <TextField {...params} label="Tecnologias" />}
    />
  );
}

export function FixedTagsDemo() {
  const fixed = ['React'];
  const [value, setValue] = useState<string[]>([...fixed, 'SQL']);
  return (
    <Autocomplete
      multiple
      options={SKILLS}
      value={value}
      onChange={(_, v) => setValue([...fixed, ...v.filter((o) => !fixed.includes(o))])}
      renderValue={(tags, getItemProps) =>
        tags.map((option, index) => {
          const { key, ...itemProps } = getItemProps({ index });
          return <Chip key={key} label={option} {...itemProps} disabled={fixed.includes(option)} size="small" />;
        })
      }
      renderInput={(params) => <TextField {...params} label="Obrigatórias fixas" />}
    />
  );
}

interface Creatable {
  label: string;
  input?: string;
}
const filter = createFilterOptions<Creatable>();

export function CreatableDemo() {
  const [options, setOptions] = useState<Creatable[]>(['Financeiro', 'Comercial', 'Tecnologia'].map((label) => ({ label })));
  const [value, setValue] = useState<Creatable | null>(null);
  return (
    <Autocomplete<Creatable, false, false, true>
      freeSolo
      selectOnFocus
      clearOnBlur
      handleHomeEndKeys
      value={value}
      options={options}
      getOptionLabel={(o) => (typeof o === 'string' ? o : o.label)}
      onChange={(_, v) => {
        if (v === null) return setValue(null);
        const label = typeof v === 'string' ? v : (v.input ?? v.label);
        if (!options.some((o) => o.label === label)) setOptions((prev) => [...prev, { label }]);
        setValue({ label });
      }}
      filterOptions={(opts, params) => {
        const filtered = filter(opts, params);
        const typed = params.inputValue.trim();
        if (typed && !opts.some((o) => o.label.toLowerCase() === typed.toLowerCase())) {
          filtered.push({ input: typed, label: `Adicionar "${typed}"` });
        }
        return filtered;
      }}
      renderInput={(params) => <TextField {...params} label="Setor" helperText="Digite um nome que não existe para criá-lo." />}
    />
  );
}
