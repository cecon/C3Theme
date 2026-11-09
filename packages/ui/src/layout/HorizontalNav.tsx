import { MouseEvent, useState } from 'react';
import { Link as RouterLink, useLocation } from 'react-router';

// material-ui
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import type { Theme } from '@mui/material/styles';

// third-party
import { ArrowDown2 } from 'iconsax-reactjs';

import { useUiConfig } from '../config';
import { toneText } from '../theme/soft';
import { activeItemId, containsId, flattenNav, NavItem, useNav } from './nav';

/** Menu em barra abaixo do header: cada item de primeiro nível vira botão; os que têm filhos abrem uma lista. */
export default function HorizontalNav() {
  const groups = useNav();
  const { pathname, search } = useLocation();
  const active = activeItemId(groups, pathname, search);
  const items = groups.flatMap((g) => g.items);

  return (
    <Stack direction="row" spacing={0.5} sx={{ px: 2, py: 0.75, overflowX: 'auto' }}>
      {items.map((item) => (
        <TopItem key={item.id} item={item} active={active} />
      ))}
    </Stack>
  );
}

function TopItem({ item, active }: { item: NavItem; active?: string }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const Icon = item.icon;
  const on = containsId(item, active);
  // na barra colorida do Angle: itens brancos e o atual em pílula branca, como os módulos do Angle
  const tinted = useUiConfig().config.look === 'angle';
  const sx = tinted
    ? {
        color: on ? 'info.main' : 'inherit',
        bgcolor: on ? 'background.paper' : undefined,
        flexShrink: 0,
        '&:hover': { bgcolor: on ? 'background.paper' : 'rgb(255 255 255 / 0.15)' }
      }
    : // o azul cheio sobre o cinza do selecionado não passa de 4:1; o tom de texto do primário passa nos dois modos
      (theme: Theme) => ({
        ...(on ? toneText(theme, 'primary') : { color: 'text.primary' }),
        bgcolor: on ? 'action.selected' : undefined,
        flexShrink: 0
      });
  const startIcon = Icon ? <Icon size={18} variant={on ? 'Bulk' : 'Linear'} /> : undefined;

  if (!item.children?.length) {
    const link = item.external ? { href: item.url, target: '_blank' } : { component: RouterLink, to: item.url ?? '#' };
    return (
      <Button {...link} startIcon={startIcon} sx={sx}>
        {item.title}
        {item.badge}
      </Button>
    );
  }

  const leaves = flattenNav([{ id: item.id, items: item.children }]);
  return (
    <>
      <Button
        startIcon={startIcon}
        endIcon={<ArrowDown2 size={14} />}
        sx={sx}
        onClick={(e: MouseEvent<HTMLElement>) => setAnchor(e.currentTarget)}
      >
        {item.title}
      </Button>
      <Menu anchorEl={anchor} open={anchor !== null} onClose={() => setAnchor(null)}>
        {leaves.map(({ item: leaf, trail }) => (
          <MenuItem
            key={leaf.id}
            selected={leaf.id === active}
            onClick={() => setAnchor(null)}
            {...(leaf.external ? { component: 'a', href: leaf.url, target: '_blank' } : { component: RouterLink, to: leaf.url! })}
            sx={{ pl: 2 + trail.length * 1.5 }}
          >
            {leaf.title}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
