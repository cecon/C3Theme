import { useState } from 'react';

// material-ui
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

// third-party
import { Table } from '@tanstack/react-table';
import { Setting4 } from 'iconsax-reactjs';

import { colLabel } from '@c3theme/ui/table';

/** Botão "Colunas" com a lista de colunas para mostrar ou ocultar. */
export default function ColumnVisibilityMenu<T>({ table }: { table: Table<T> }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const colunas = table.getAllLeafColumns().filter((c) => c.getCanHide());
  const ocultas = colunas.filter((c) => !c.getIsVisible()).length;

  return (
    <>
      <Button
        variant="outlined"
        color="secondary"
        startIcon={<Setting4 size={18} />}
        onClick={(e) => setAnchor(e.currentTarget)}
        aria-haspopup="menu"
      >
        Colunas{ocultas > 0 ? ` (${colunas.length - ocultas}/${colunas.length})` : ''}
      </Button>
      <Menu
        anchorEl={anchor}
        open={!!anchor}
        onClose={() => setAnchor(null)}
        slotProps={{ paper: { sx: { maxHeight: 380, minWidth: 220 } } }}
      >
        <MenuItem dense onClick={() => table.toggleAllColumnsVisible(!table.getIsAllColumnsVisible())}>
          <ListItemIcon>
            <Checkbox
              size="small"
              edge="start"
              checked={table.getIsAllColumnsVisible()}
              indeterminate={table.getIsSomeColumnsVisible() && !table.getIsAllColumnsVisible()}
              tabIndex={-1}
            />
          </ListItemIcon>
          <ListItemText primary="Todas" />
        </MenuItem>
        <Divider />
        {colunas.map((c) => (
          <MenuItem key={c.id} dense onClick={() => c.toggleVisibility()}>
            <ListItemIcon>
              <Checkbox size="small" edge="start" checked={c.getIsVisible()} tabIndex={-1} />
            </ListItemIcon>
            <ListItemText primary={colLabel(c)} />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
