import { MouseEvent, useState } from 'react';

// material-ui
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import TextField from '@mui/material/TextField';

// third-party
import { More, TickCircle } from 'iconsax-reactjs';

import { Period, PERIOD_LABELS, PERIODS } from './period';

interface PeriodControlProps {
  value: Period;
  onChange: (period: Period) => void;
  /** Quais períodos oferecer (padrão: todos). */
  options?: Period[];
}

/** Botão "mais" que abre o menu de período. Fica no canto do cartão. */
export function PeriodMenu({ value, onChange, options = PERIODS }: PeriodControlProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const open = (e: MouseEvent<HTMLElement>) => setAnchor(e.currentTarget);

  return (
    <>
      <IconButton size="small" aria-label="Escolher período" aria-haspopup="menu" onClick={open} sx={{ color: 'text.secondary' }}>
        <More size={20} style={{ transform: 'rotate(90deg)' }} />
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={!!anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuList dense disablePadding>
          {options.map((p) => (
            <MenuItem
              key={p}
              selected={p === value}
              onClick={() => {
                onChange(p);
                setAnchor(null);
              }}
            >
              <ListItemIcon sx={{ color: 'primary.main' }}>{p === value && <TickCircle size={16} variant="Bold" />}</ListItemIcon>
              <ListItemText>{PERIOD_LABELS[p]}</ListItemText>
            </MenuItem>
          ))}
        </MenuList>
      </Menu>
    </>
  );
}

/** Seletor de período compacto (campo de seleção). */
export function PeriodSelect({ value, onChange, options = PERIODS }: PeriodControlProps) {
  return (
    <TextField
      select
      size="small"
      value={value}
      onChange={(e) => onChange(e.target.value as Period)}
      slotProps={{ htmlInput: { 'aria-label': 'Período' } }}
      sx={{ minWidth: 130, '& .MuiSelect-select': { py: 0.75 } }}
    >
      {options.map((p) => (
        <MenuItem key={p} value={p}>
          {PERIOD_LABELS[p]}
        </MenuItem>
      ))}
    </TextField>
  );
}
