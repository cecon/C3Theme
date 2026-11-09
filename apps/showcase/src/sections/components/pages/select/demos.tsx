// Seleção: básica, com ajuda, múltipla e status.
import { useState } from 'react';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { StatusChip, type StatusTone } from '@c3theme/ui';
import { DEPARTMENTS } from '../../data';

export const REGIONS = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'] as const;
const STATUS: { value: string; label: string; tone: StatusTone }[] = [
  { value: 'rascunho', label: 'Rascunho', tone: 'neutral' },
  { value: 'analise', label: 'Em análise', tone: 'info' },
  { value: 'aprovado', label: 'Aprovado', tone: 'success' },
  { value: 'pendente', label: 'Pendente', tone: 'warning' },
  { value: 'recusado', label: 'Recusado', tone: 'danger' }
];
export const MENU_PROPS = { slotProps: { paper: { sx: { maxHeight: 300 } } } };

export function BasicDemo() {
  const [dept, setDept] = useState('Comercial');
  return (
    <FormControl fullWidth>
      <InputLabel id="dept-label">Departamento</InputLabel>
      <Select labelId="dept-label" value={dept} label="Departamento" onChange={(e) => setDept(e.target.value)}>
        {DEPARTMENTS.map((d) => (
          <MenuItem key={d} value={d}>
            {d}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export function HelperDemo() {
  const [value, setValue] = useState('');
  return (
    <Stack spacing={2}>
      <FormControl fullWidth>
        <InputLabel id="prioridade-label">Prioridade</InputLabel>
        <Select labelId="prioridade-label" value={value} label="Prioridade" displayEmpty onChange={(e) => setValue(e.target.value)}>
          <MenuItem value="">
            <em>Nenhuma</em>
          </MenuItem>
          <MenuItem value="baixa">Baixa</MenuItem>
          <MenuItem value="media">Média</MenuItem>
          <MenuItem value="alta">Alta</MenuItem>
        </Select>
        <FormHelperText>Define a ordem na fila de atendimento.</FormHelperText>
      </FormControl>
      <FormControl fullWidth error>
        <InputLabel id="erro-label">Centro de custo</InputLabel>
        <Select labelId="erro-label" value="" label="Centro de custo" displayEmpty={false} onChange={() => undefined}>
          <MenuItem value="adm">Administrativo</MenuItem>
        </Select>
        <FormHelperText>Campo obrigatório.</FormHelperText>
      </FormControl>
      <FormControl fullWidth disabled>
        <InputLabel id="disabled-label">Filial</InputLabel>
        <Select labelId="disabled-label" value="cwb" label="Filial">
          <MenuItem value="cwb">Curitiba</MenuItem>
        </Select>
        <FormHelperText>Definida pelo administrador.</FormHelperText>
      </FormControl>
    </Stack>
  );
}

export function MultipleDemo() {
  const [value, setValue] = useState<string[]>(['Financeiro', 'Tecnologia']);
  return (
    <Stack spacing={2}>
      <FormControl fullWidth>
        <InputLabel id="multi-check-label">Departamentos</InputLabel>
        <Select
          labelId="multi-check-label"
          multiple
          value={value}
          onChange={(e) => setValue(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
          input={<OutlinedInput label="Departamentos" />}
          renderValue={(selected) => selected.join(', ')}
          MenuProps={MENU_PROPS}
        >
          {DEPARTMENTS.map((d) => (
            <MenuItem key={d} value={d}>
              <Checkbox checked={value.includes(d)} size="small" />
              <ListItemText primary={d} />
            </MenuItem>
          ))}
        </Select>
        <FormHelperText>Com caixas de seleção.</FormHelperText>
      </FormControl>
      <FormControl fullWidth>
        <InputLabel id="multi-chip-label">Departamentos</InputLabel>
        <Select
          labelId="multi-chip-label"
          multiple
          value={value}
          onChange={(e) => setValue(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
          input={<OutlinedInput label="Departamentos" />}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.map((v) => (
                <Chip key={v} label={v} size="small" />
              ))}
            </Box>
          )}
          MenuProps={MENU_PROPS}
        >
          {DEPARTMENTS.map((d) => (
            <MenuItem key={d} value={d}>
              {d}
            </MenuItem>
          ))}
        </Select>
        <FormHelperText>Com chips.</FormHelperText>
      </FormControl>
    </Stack>
  );
}

export function StatusDemo() {
  const [status, setStatus] = useState('analise');
  return (
    <TextField
      select
      fullWidth
      label="Situação"
      value={status}
      onChange={(e) => setStatus(e.target.value)}
      slotProps={{
        select: {
          renderValue: (v) => {
            const s = STATUS.find((x) => x.value === v)!;
            return <StatusChip label={s.label} tone={s.tone} />;
          }
        }
      }}
    >
      {STATUS.map((s) => (
        <MenuItem key={s.value} value={s.value}>
          <StatusChip label={s.label} tone={s.tone} />
        </MenuItem>
      ))}
    </TextField>
  );
}
