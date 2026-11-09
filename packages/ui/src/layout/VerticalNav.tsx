import { useState } from 'react';
import { Link as RouterLink, useLocation } from 'react-router';

// material-ui
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { Theme } from '@mui/material/styles';

// third-party
import { ArrowDown2 } from 'iconsax-reactjs';

import { useUiConfig } from '../config';
import { selectedText } from '../theme/soft';
import { activeItemId, containsId, NavItem, useNav } from './nav';

/** Menu lateral. Em `mini`, só ícones com o título no tooltip; clicar num grupo com filhos chama `onExpand`. */
export default function VerticalNav({ mini, onNavigate, onExpand }: { mini?: boolean; onNavigate?: () => void; onExpand?: () => void }) {
  const groups = useNav();
  const { pathname, search } = useLocation();
  const active = activeItemId(groups, pathname, search);
  const { config } = useUiConfig();

  return (
    <Box component="nav" sx={{ px: 1.5, py: 1 }}>
      {groups.map((g) => (
        <List
          key={g.id}
          dense
          disablePadding
          sx={{ mb: 1.5 }}
          subheader={
            g.title && !mini && config.menuCaption ? (
              <Typography variant="overline" component="li" color="text.secondary" sx={{ display: 'block', px: 1.5, pt: 1, pb: 0.5 }}>
                {g.title}
              </Typography>
            ) : undefined
          }
        >
          <Branch items={g.items} depth={0} active={active} mini={mini} onNavigate={onNavigate} onExpand={onExpand} />
        </List>
      ))}
    </Box>
  );
}

interface ItemProps {
  item: NavItem;
  depth: number;
  active?: string;
  mini?: boolean;
  onNavigate?: () => void;
  onExpand?: () => void;
}

/** Recuo do texto: o subitem começa onde começa o texto do pai (12 px + 34 px do ícone), mais 14 px por nível. */
const indent = (depth: number) => (depth === 0 ? 1.5 : 5.75 + (Math.min(depth, 3) - 1) * 1.75);

/**
 * Irmãos de um nível. Acordeão exclusivo: abrir um grupo fecha o outro aberto, e tudo começa fechado menos
 * o caminho até a tela atual. Assim o menu não vira uma lista que rola.
 */
function Branch({ items, ...rest }: Omit<ItemProps, 'item'> & { items: NavItem[] }) {
  const holder = items.find((i) => i.children?.length && containsId(i, rest.active))?.id;
  const [open, setOpen] = useState(holder);
  // a tela mudou por fora (busca, link): abre o grupo dela, ajustando no render como o React recomenda
  const [seen, setSeen] = useState(rest.active);
  if (seen !== rest.active) {
    setSeen(rest.active);
    if (holder) setOpen(holder);
  }
  return (
    <>
      {/* cada item num <li>: o <ul> só pode ter <li> como filho (o subgrupo vai dentro do <li> do pai) */}
      {items.map((item) => (
        <ListItem key={item.id} disablePadding sx={{ display: 'block' }}>
          <Item {...rest} item={item} open={open === item.id} onToggle={() => setOpen((o) => (o === item.id ? undefined : item.id))} />
        </ListItem>
      ))}
    </>
  );
}

function Item({ item, depth, active, mini, onNavigate, onExpand, open, onToggle }: ItemProps & { open: boolean; onToggle: () => void }) {
  const inside = containsId(item, active);
  const Icon = item.icon;
  const selected = item.id === active;

  const icon = Icon ? (
    <ListItemIcon sx={{ minWidth: mini ? 0 : 34, color: selected || inside ? 'primary.main' : 'text.secondary' }}>
      <Icon size={20} variant={selected || inside ? 'Bulk' : 'Linear'} />
    </ListItemIcon>
  ) : null;

  const common = {
    selected,
    sx: (theme: Theme) => ({
      mb: 0.25,
      minHeight: depth ? 36 : 40,
      pl: mini ? 1.25 : indent(depth),
      justifyContent: mini ? 'center' : 'flex-start',
      '&.Mui-selected': { ...selectedText(theme), fontWeight: 600 }
    })
  };

  if (item.children?.length) {
    const button = (
      <ListItemButton {...common} aria-expanded={mini ? undefined : open} onClick={() => (mini ? onExpand?.() : onToggle())}>
        {icon}
        {!mini && <ListItemText primary={item.title} slotProps={{ primary: { noWrap: true, sx: { fontWeight: inside ? 600 : 500 } } }} />}
        {!mini && <ArrowDown2 size={14} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />}
      </ListItemButton>
    );
    return (
      <>
        {mini ? (
          <Tooltip title={item.title} placement="right">
            {button}
          </Tooltip>
        ) : (
          button
        )}
        {!mini && (
          <Collapse in={open} unmountOnExit>
            <List
              dense
              disablePadding
              // linha-guia sob o ícone do módulo: mostra a que grupo os subitens pertencem
              sx={
                depth === 0
                  ? {
                      position: 'relative',
                      '&::before': { content: '""', position: 'absolute', left: 22, top: 4, bottom: 8, width: '1px', bgcolor: 'divider' }
                    }
                  : undefined
              }
            >
              <Branch items={item.children} depth={depth + 1} active={active} onNavigate={onNavigate} />
            </List>
          </Collapse>
        )}
      </>
    );
  }

  const link = item.external
    ? { component: 'a' as const, href: item.url, target: '_blank', rel: 'noreferrer' }
    : { component: RouterLink, to: item.url ?? '#', onClick: onNavigate };
  const button = (
    <ListItemButton {...common} {...link}>
      {icon}
      {!mini && <ListItemText primary={item.title} slotProps={{ primary: { noWrap: true, sx: { fontWeight: selected ? 600 : 500 } } }} />}
      {!mini && item.badge}
    </ListItemButton>
  );
  return mini ? (
    <Tooltip title={item.title} placement="right">
      {button}
    </Tooltip>
  ) : (
    button
  );
}
