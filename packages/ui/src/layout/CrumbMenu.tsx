import { ReactNode, useId, useState } from 'react';
import { Link as RouterLink } from 'react-router';

// material-ui
import ButtonBase from '@mui/material/ButtonBase';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';

// third-party
import { ArrowDown2 } from 'iconsax-reactjs';

import type { CrumbOption } from './crumbs';

/**
 * Nível do caminho sem tela própria (ex.: um grupo do menu): em vez de um link morto, abre a lista das telas
 * do grupo. Enter/Espaço/seta para baixo abrem; setas navegam; Esc fecha e devolve o foco ao botão.
 */
export default function CrumbMenu({ title, options }: { title: ReactNode; options: CrumbOption[] }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const id = useId();
  const open = Boolean(anchor);
  return (
    <>
      <ButtonBase
        id={`${id}-btn`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? `${id}-menu` : undefined}
        onClick={(e) => setAnchor(e.currentTarget)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setAnchor(e.currentTarget);
          }
        }}
        sx={{
          gap: 0.25,
          px: 0.5,
          mx: -0.5,
          borderRadius: 1,
          color: 'text.secondary',
          typography: 'body2',
          '&:hover': { color: 'text.primary', bgcolor: 'action.hover' },
          '&.Mui-focusVisible': { outline: 2, outlineColor: 'primary.main', outlineOffset: 1 }
        }}
      >
        {title}
        <ArrowDown2 size={12} aria-hidden />
      </ButtonBase>
      <Menu
        id={`${id}-menu`}
        anchorEl={anchor}
        open={open}
        onClose={() => setAnchor(null)}
        slotProps={{ list: { 'aria-labelledby': `${id}-btn`, dense: true } }}
      >
        {options.map((o) => (
          <MenuItem
            key={o.to}
            component={RouterLink}
            to={o.to}
            selected={o.current}
            aria-current={o.current ? 'page' : undefined}
            onClick={() => setAnchor(null)}
          >
            <Typography variant="body2">{o.title}</Typography>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
