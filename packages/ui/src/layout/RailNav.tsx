import { Fragment } from 'react';
import { Link as RouterLink } from 'react-router';

// material-ui
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { alpha, Theme } from '@mui/material/styles';

import { useUiText } from '../i18n';
import { toneText } from '../theme/soft';
import { containsId, NavGroup, NavItem } from './nav';

export const RAIL_WIDTH = 88;

interface RailNavProps {
  groups: NavGroup[];
  active?: string;
  /** Módulo com o painel aberto. */
  open?: string;
  onOpen: (id: string) => void;
  onNavigate?: () => void;
}

/**
 * Trilho de módulos: cada item de primeiro nível é um botão com ícone e nome embaixo. Módulo com filhos
 * abre o painel ao lado; item sem filhos é link direto (ex.: Início). Grupos viram só uma divisória.
 */
export default function RailNav({ groups, active, open, onOpen, onNavigate }: RailNavProps) {
  const t = useUiText();
  return (
    <Box component="nav" aria-label={t('c3.menu.modules')} sx={{ py: 1, px: 0.75 }}>
      {groups.map((g, i) => (
        <Fragment key={g.id}>
          {i > 0 && g.items.length > 0 && <Divider sx={{ my: 1, mx: 1.5 }} />}
          {g.items.map((item) => (
            <RailItem
              key={item.id}
              item={item}
              on={containsId(item, active)}
              open={open === item.id}
              onOpen={onOpen}
              onNavigate={onNavigate}
            />
          ))}
        </Fragment>
      ))}
    </Box>
  );
}

function RailItem({
  item,
  on,
  open,
  onOpen,
  onNavigate
}: {
  item: NavItem;
  on: boolean;
  open: boolean;
  onOpen: (id: string) => void;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const group = Boolean(item.children?.length);
  const target = group
    ? { onClick: () => onOpen(item.id), 'aria-expanded': open }
    : item.external
      ? { component: 'a' as const, href: item.url, target: '_blank', rel: 'noreferrer' }
      : { component: RouterLink, to: item.url ?? '#', onClick: onNavigate, 'aria-current': on ? ('page' as const) : undefined };
  const lit = on || open;

  return (
    <ButtonBase
      {...target}
      title={item.title}
      sx={(theme) => ({
        width: '100%',
        flexDirection: 'column',
        gap: 0.5,
        py: 1,
        px: 0.25,
        mb: 0.5,
        borderRadius: 2,
        // tom de texto do primário: o azul cheio sobre o fundo tingido do grupo aberto não passa de 4,5:1 no escuro
        ...(lit ? toneText(theme, 'primary') : { color: 'text.secondary' }),
        bgcolor: open ? picked(theme) : on ? 'action.hover' : 'transparent',
        transition: 'background-color .15s, color .15s',
        '&:hover': { bgcolor: open ? picked(theme) : 'action.hover', ...(lit ? toneText(theme, 'primary') : { color: 'text.primary' }) },
        '&.Mui-focusVisible': { outline: 2, outlineColor: 'primary.main', outlineOffset: -2 }
      })}
    >
      {Icon ? <Icon size={22} variant={lit ? 'Bulk' : 'Linear'} /> : <Initial title={item.title} />}
      <Typography
        component="span"
        sx={{
          fontSize: 11,
          lineHeight: 1.2,
          fontWeight: lit ? 600 : 500,
          textAlign: 'center',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          // nome longo quebra com hífen pelo idioma da página (Configu-rações), não no meio da letra
          hyphens: 'auto'
        }}
      >
        {item.title}
      </Typography>
      {item.badge && <Box sx={{ position: 'absolute', top: 2, right: 6 }}>{item.badge}</Box>}
    </ButtonBase>
  );
}

/** Mesmo fundo do item selecionado das listas (cor da marca bem clara), para o módulo aberto e a tela atual combinarem. */
const picked = (t: Theme) =>
  t.vars
    ? `rgba(${t.vars.palette.primary.mainChannel} / ${t.vars.palette.action.selectedOpacity})`
    : alpha(t.palette.primary.main, t.palette.action.selectedOpacity);

/** Módulo sem ícone: a inicial num quadrado, para o trilho não ficar com buraco. */
function Initial({ title }: { title: string }) {
  return (
    <Box
      aria-hidden
      sx={{ width: 22, height: 22, borderRadius: 1, border: 1.5, display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700 }}
    >
      {title.trim().charAt(0).toUpperCase()}
    </Box>
  );
}
