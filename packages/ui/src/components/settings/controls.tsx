import { HTMLAttributes, ReactNode } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button, { ButtonProps } from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Slider from '@mui/material/Slider';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';

import { DISABLED_OPACITY, useSettingsRow } from './context';

// Controles prontos para o lado direito de um SettingsRow. Todos tiram da linha o rótulo (aria-labelledby), a
// explicação (aria-describedby) e o desabilitado, e mudam na hora: a tela de ajustes não tem botão de salvar.

export interface SettingsSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function SettingsSwitch({ checked, onChange }: SettingsSwitchProps) {
  const row = useSettingsRow();
  return (
    <Switch
      size="small"
      checked={checked}
      disabled={row.disabled}
      onChange={(_, value) => onChange(value)}
      slotProps={{ input: { role: 'switch', 'aria-labelledby': row.labelId, 'aria-describedby': row.descriptionId } }}
    />
  );
}

export interface SettingsSelectOption<T extends string = string> {
  value: T;
  label: ReactNode;
}

export interface SettingsSelectProps<T extends string = string> {
  value: T;
  options: SettingsSelectOption<T>[];
  onChange: (value: T) => void;
  /** largura mínima da caixa; padrão 160 px */
  minWidth?: number;
}

export function SettingsSelect<T extends string = string>({ value, options, onChange, minWidth = 160 }: SettingsSelectProps<T>) {
  const row = useSettingsRow();
  return (
    <Select
      size="small"
      value={value}
      disabled={row.disabled}
      onChange={(e) => onChange(e.target.value as T)}
      labelId={row.labelId}
      SelectDisplayProps={{ 'aria-describedby': row.descriptionId } as HTMLAttributes<HTMLDivElement>}
      sx={{ minWidth }}
    >
      {options.map((o) => (
        <MenuItem key={o.value} value={o.value}>
          {o.label}
        </MenuItem>
      ))}
    </Select>
  );
}

export interface SettingsSliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  /** unidade mostrada ao lado do valor, por exemplo "pt" ou "%" */
  unit?: string;
  /** formata o valor mostrado e lido pelo leitor de tela; padrão `valor unidade` ("480 pt", "85 %") */
  format?: (value: number) => string;
  /** largura da barra; padrão 180 px */
  width?: number;
}

export function SettingsSlider({ value, onChange, min, max, step = 1, unit, format, width = 180 }: SettingsSliderProps) {
  const row = useSettingsRow();
  const text = (v: number) => (format ? format(v) : unit ? `${v} ${unit}` : String(v));
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Slider
        size="small"
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={row.disabled}
        onChange={(_, v) => onChange(v as number)}
        getAriaValueText={text}
        aria-labelledby={row.labelId}
        slotProps={{ input: { 'aria-describedby': row.descriptionId } }}
        sx={{ width }}
      />
      <Typography
        variant="body2"
        aria-hidden
        sx={{
          minWidth: 56,
          textAlign: 'right',
          fontVariantNumeric: 'tabular-nums',
          opacity: row.disabled ? DISABLED_OPACITY : 1
        }}
      >
        {text(value)}
      </Typography>
    </Box>
  );
}

/** Botão como controle da linha (ex.: "Escolher pasta…"); o texto do botão é o nome dele, a explicação vai junto. */
export function SettingsAction({ children, ...props }: Omit<ButtonProps, 'size' | 'disabled'>) {
  const row = useSettingsRow();
  return (
    <Button size="small" variant="outlined" color="secondary" {...props} disabled={row.disabled} aria-describedby={row.descriptionId}>
      {children}
    </Button>
  );
}
