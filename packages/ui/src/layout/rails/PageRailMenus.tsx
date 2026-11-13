import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import { Bookmark, Bookmark2 } from 'iconsax-reactjs';
import { Link as RouterLink } from 'react-router';
import type { PageRailHelp, PageRailItem } from './types';

interface Props {
  pages: readonly PageRailItem[];
  activeId?: string;
  pinned: ReadonlySet<string>;
  pageAnchor: HTMLElement | null;
  helpAnchor: HTMLElement | null;
  help?: PageRailHelp;
  onPageClose(): void;
  onHelpClose(): void;
  onToggle(page: PageRailItem): void;
}
/** Cada ação é um item de menu independente: setas navegam, Enter/Espaço fixam sem fechar. */
export default function PageRailMenus({
  pages,
  activeId,
  pinned,
  pageAnchor,
  helpAnchor,
  help,
  onPageClose,
  onHelpClose,
  onToggle
}: Props) {
  return (
    <>
      <Menu
        anchorEl={pageAnchor}
        open={pageAnchor !== null}
        onClose={onPageClose}
        transitionDuration={0}
        slotProps={{ list: { sx: { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto' } } }}
      >
        {pages.flatMap((page, index) => {
          const fixed = index === 0 || page.fixed === true;
          return [
            <MenuItem
              key={page.id}
              selected={activeId === page.id}
              aria-current={activeId === page.id ? 'page' : undefined}
              onClick={onPageClose}
              component={RouterLink}
              to={page.url}
              sx={{ gap: 1, gridColumn: fixed ? '1 / -1' : undefined }}
            >
              {page.icon ? <page.icon size={18} /> : <Box sx={{ width: 18 }} />}
              {page.title}
            </MenuItem>,
            ...(fixed
              ? []
              : [
                  <MenuItem
                    key={`${page.id}-pin`}
                    component="button"
                    aria-label={pinned.has(page.id) ? `Desafixar ${page.title}` : `Fixar ${page.title} no rail`}
                    aria-pressed={pinned.has(page.id)}
                    onClick={() => onToggle(page)}
                    sx={{ justifyContent: 'center', minWidth: 44 }}
                  >
                    {pinned.has(page.id) ? <Bookmark2 size={16} /> : <Bookmark size={16} />}
                  </MenuItem>
                ])
          ];
        })}
      </Menu>
      <Menu anchorEl={helpAnchor} open={helpAnchor !== null} onClose={onHelpClose} transitionDuration={0}>
        <Box sx={{ px: 2, py: 1, minWidth: 260 }}>
          <Typography variant="subtitle2">{`Versão ${help?.version ?? ''}`}</Typography>
          {help?.loadingNotes ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Carregando notas…
            </Typography>
          ) : help?.releaseNotes ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, whiteSpace: 'pre-line' }}>
              {help.releaseNotes}
            </Typography>
          ) : null}
        </Box>
        <Divider />
        {(help?.links ?? []).map((link) => (
          <MenuItem key={link.href} component="a" href={link.href} target="_blank" rel="noreferrer" onClick={onHelpClose}>
            {link.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
