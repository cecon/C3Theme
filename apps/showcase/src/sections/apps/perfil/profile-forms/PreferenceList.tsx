// Lista de preferências liga/desliga.
import { ReactNode } from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Switch from '@mui/material/Switch';

// ---------------------------------------------------------------- preferências

export interface Preference {
  id: string;
  title: string;
  description?: string;
  icon?: ReactNode;
}

/** Lista de preferências liga/desliga. */
export function PreferenceList({
  items,
  value,
  onChange
}: {
  items: Preference[];
  value: Record<string, boolean>;
  onChange: (id: string, on: boolean) => void;
}) {
  return (
    <List disablePadding>
      {items.map((p, i) => (
        <ListItem key={p.id} divider={i < items.length - 1} sx={{ px: 0, py: 1.25, gap: 2 }}>
          {p.icon && <ListItemIcon sx={{ minWidth: 0, color: 'text.secondary' }}>{p.icon}</ListItemIcon>}
          <ListItemText
            id={`pref-${p.id}`}
            primary={p.title}
            secondary={p.description}
            slotProps={{ primary: { variant: 'subtitle2' } }}
            sx={{ my: 0 }}
          />
          <Switch
            edge="end"
            checked={!!value[p.id]}
            onChange={(e) => onChange(p.id, e.target.checked)}
            slotProps={{ input: { 'aria-labelledby': `pref-${p.id}` } }}
          />
        </ListItem>
      ))}
    </List>
  );
}
