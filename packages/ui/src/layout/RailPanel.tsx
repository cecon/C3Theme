import { Link as RouterLink } from 'react-router';

// material-ui
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';

import { selectedText } from '../theme/soft';
import { dragRegionSx } from './desktop';
import { flattenNav, NavItem } from './nav';

export const PANEL_WIDTH = 236;

interface RailPanelProps {
  module: NavItem;
  active?: string;
  headerHeight: number;
  onNavigate?: () => void;
  /** App de desktop: o título do painel também arrasta a janela. */
  drag?: boolean;
}

/**
 * Painel do módulo escolhido no trilho. Filho sem filhos é tela; filho com filhos vira título de seção
 * (não clica, não recolhe) com as telas embaixo. Do terceiro nível em diante, as telas entram na seção com
 * o caminho no texto secundário: o menu não esconde nada, mas também não aprofunda.
 */
export default function RailPanel({ module, active, headerHeight, onNavigate, drag = false }: RailPanelProps) {
  const loose = module.children!.filter((c) => !c.children?.length);
  const sections = module.children!.filter((c) => c.children?.length);

  return (
    <Box component="nav" aria-label={module.title} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={[{ height: headerHeight, display: 'flex', alignItems: 'center', px: 2.5, flexShrink: 0 }, drag ? dragRegionSx : {}]}>
        <Typography variant="h6" noWrap sx={{ fontSize: 16 }}>
          {module.title}
        </Typography>
      </Box>
      <Box sx={{ flex: 1, overflowY: 'auto', px: 1.25, pb: 2 }}>
        {loose.length > 0 && <Links items={loose.map((item) => ({ item, trail: [] }))} active={active} onNavigate={onNavigate} />}
        {sections.map((s) => (
          <Box key={s.id} component="section" aria-labelledby={`${s.id}-titulo`} sx={{ mt: 2 }}>
            <Typography
              id={`${s.id}-titulo`}
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', px: 1.25, pb: 0.5, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}
            >
              {s.title}
            </Typography>
            <Links items={flattenNav([{ id: s.id, items: s.children! }])} active={active} onNavigate={onNavigate} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function Links({ items, active, onNavigate }: { items: { item: NavItem; trail: string[] }[]; active?: string; onNavigate?: () => void }) {
  return (
    <List dense disablePadding>
      {items.map(({ item, trail }) => {
        const selected = item.id === active;
        const link = item.external
          ? { component: 'a' as const, href: item.url, target: '_blank', rel: 'noreferrer' }
          : { component: RouterLink, to: item.url ?? '#', onClick: onNavigate };
        const Icon = item.icon;
        return (
          <ListItem key={item.id} disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              {...link}
              selected={selected}
              aria-current={selected ? 'page' : undefined}
              sx={(theme) => ({ minHeight: 36, mb: 0.25, px: 1.25, gap: 1.25, '&.Mui-selected': selectedText(theme) })}
            >
              {Icon && <Icon size={18} variant={selected ? 'Bulk' : 'Linear'} />}
              <ListItemText
                primary={item.title}
                secondary={trail.length ? trail.join(' › ') : undefined}
                slotProps={{
                  primary: { noWrap: true, sx: { fontWeight: selected ? 600 : 500 } },
                  secondary: { noWrap: true, sx: { fontSize: 11 } }
                }}
              />
              {item.badge}
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );
}
