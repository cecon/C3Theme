// Autocomplete com busca no servidor, etiquetas e pessoas.
import { useEffect, useState } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { Dot, SoftAvatar, type Tone } from '@c3theme/ui';
import { CITIES, City, initials, PEOPLE, Person } from '../../data';
import { cityLabel } from './demos';

// simula uma busca no servidor com atraso
export function AsyncDemo() {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<City[]>([]);
  const loading = open && options.length === 0;

  useEffect(() => {
    if (!loading) return;
    const t = window.setTimeout(() => setOptions(CITIES), 1200);
    return () => window.clearTimeout(t);
  }, [loading]);

  return (
    <Autocomplete
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => {
        setOpen(false);
        setOptions([]);
      }}
      options={options}
      loading={loading}
      loadingText="Buscando cidades…"
      getOptionLabel={cityLabel}
      isOptionEqualToValue={(a, b) => a.name === b.name}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Cidade (carregada do servidor)"
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

const LABELS: { name: string; tone: Tone; description: string }[] = [
  { name: 'urgente', tone: 'danger', description: 'Precisa de atenção hoje' },
  { name: 'melhoria', tone: 'success', description: 'Sugestão de evolução' },
  { name: 'dúvida', tone: 'info', description: 'Pergunta de cliente' },
  { name: 'bloqueado', tone: 'warning', description: 'Aguardando terceiros' },
  { name: 'documentação', tone: 'secondary', description: 'Textos e manuais' }
];

export function LabelsDemo() {
  const [value, setValue] = useState([LABELS[0]!, LABELS[2]!]);
  return (
    <Autocomplete
      multiple
      disableCloseOnSelect
      options={LABELS}
      value={value}
      onChange={(_, v) => setValue(v)}
      getOptionLabel={(o) => o.name}
      isOptionEqualToValue={(a, b) => a.name === b.name}
      renderOption={(props, option, { selected }) => {
        const { key, ...rest } = props;
        return (
          <li key={key} {...rest}>
            <Checkbox size="small" checked={selected} sx={{ mr: 1, p: 0.5 }} />
            <Dot tone={option.tone} size={10} />
            <Box sx={{ ml: 1 }}>
              <Typography variant="body2">{option.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {option.description}
              </Typography>
            </Box>
          </li>
        );
      }}
      renderValue={(tags, getItemProps) =>
        tags.map((option, index) => {
          const { key, ...itemProps } = getItemProps({ index });
          return <Chip key={key} size="small" icon={<Dot tone={option.tone} />} label={option.name} {...itemProps} sx={{ pl: 0.75 }} />;
        })
      }
      renderInput={(params) => <TextField {...params} label="Etiquetas" />}
    />
  );
}

export function PeopleDemo() {
  return (
    <Autocomplete<Person>
      options={PEOPLE}
      getOptionLabel={(p) => p.name}
      renderOption={(props, p) => {
        const { key, ...rest } = props;
        return (
          <li key={key} {...rest}>
            <SoftAvatar size="sm" tone={p.tone} sx={{ mr: 1.5 }}>
              {initials(p.name)}
            </SoftAvatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" noWrap>
                {p.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {p.role} · {p.city}
              </Typography>
            </Box>
          </li>
        );
      }}
      renderInput={(params) => <TextField {...params} label="Responsável" placeholder="Busque por nome" />}
    />
  );
}
