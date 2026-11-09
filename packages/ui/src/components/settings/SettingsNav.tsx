import { ReactNode } from 'react';

// material-ui
import Box from '@mui/material/Box';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

export interface SettingsSection {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface SettingsNavProps {
  sections: SettingsSection[];
  value: string;
  onChange: (id: string) => void;
  label: string;
}

/** Navegação por seções à esquerda da tela de ajustes; a seção aberta leva aria-current. */
export default function SettingsNav({ sections, value, onChange, label }: SettingsNavProps) {
  return (
    <Box
      component="nav"
      aria-label={label}
      sx={{ width: 200, flexShrink: 0, borderRight: 1, borderColor: 'divider', bgcolor: 'background.paper', overflowY: 'auto', p: 1 }}
    >
      <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
        {sections.map((s) => (
          <li key={s.id}>
            <ListItemButton
              selected={s.id === value}
              aria-current={s.id === value ? 'page' : undefined}
              onClick={() => onChange(s.id)}
              sx={{ borderRadius: 1, py: 0.5, minHeight: 34 }}
            >
              {s.icon && <ListItemIcon sx={{ minWidth: 30 }}>{s.icon}</ListItemIcon>}
              <ListItemText primary={s.label} slotProps={{ primary: { variant: 'body2' } }} />
            </ListItemButton>
          </li>
        ))}
      </Box>
    </Box>
  );
}
