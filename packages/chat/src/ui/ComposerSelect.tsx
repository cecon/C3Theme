import { useId, useState, type ReactNode } from 'react';

// material-ui
import Box from '@mui/material/Box';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

// third-party
import { TickCircle } from 'iconsax-reactjs';

import SelectButton from './SelectButton';

export interface ComposerSelectOption<T extends string = string> {
  value: T;
  label: ReactNode;
  /** Linha de explicação embaixo, no menu. */
  description?: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface ComposerSelectProps<T extends string = string> {
  value: T;
  options: ComposerSelectOption<T>[];
  onChange: (value: T) => void;
  /** Nome do seletor para leitor de tela e título do menu ("Modo", "Modelo", "Esforço"). */
  label: string;
  /** Ícone antes do valor (escudo do modo, por exemplo). */
  icon?: ReactNode;
  /** Algo depois do valor: contexto do modelo, custo. */
  badge?: ReactNode;
  disabled?: boolean;
}

/**
 * Seletor compacto da barra da caixa de mensagem: modo/permissão, modelo, esforço. Mostra o valor como texto com
 * a setinha e abre um menu com as opções e as explicações. Não sabe de provedor nenhum: o app passa as opções.
 */
export default function ComposerSelect<T extends string = string>(props: ComposerSelectProps<T>) {
  const { value, options, onChange, label, icon, badge, disabled } = props;
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const menuId = useId();
  const current = options.find((o) => o.value === value);

  return (
    <>
      <SelectButton
        disabled={disabled}
        aria-label={`${label}: ${typeof current?.label === 'string' ? current.label : value}`}
        aria-haspopup="menu"
        aria-expanded={!!anchor}
        aria-controls={anchor ? menuId : undefined}
        onClick={(e) => setAnchor(e.currentTarget)}
        icon={icon ?? current?.icon}
        value={current?.label ?? value}
        badge={badge}
      />
      <Menu
        id={menuId}
        anchorEl={anchor}
        open={!!anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{ paper: { sx: { minWidth: 220, maxWidth: 340 } }, list: { dense: true } }}
      >
        <ListSubheader sx={{ lineHeight: 2.5 }}>{label}</ListSubheader>
        {options.map((o) => (
          <MenuItem
            key={o.value}
            selected={o.value === value}
            disabled={o.disabled}
            onClick={() => {
              setAnchor(null);
              if (o.value !== value) onChange(o.value);
            }}
            sx={{ alignItems: 'flex-start', whiteSpace: 'normal' }}
          >
            {o.icon && <ListItemIcon sx={{ mt: 0.25 }}>{o.icon}</ListItemIcon>}
            <ListItemText primary={o.label} secondary={o.description} />
            {o.value === value && (
              <Box component={TickCircle} size={16} variant="Bold" aria-hidden sx={{ color: 'primary.main', ml: 1, mt: 0.25 }} />
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
