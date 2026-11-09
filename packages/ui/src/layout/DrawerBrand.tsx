import { Link as RouterLink } from 'react-router';

// material-ui
import Box from '@mui/material/Box';

import Logo from '../components/Logo';
import { useBranding } from '../config';
import { visuallyHidden } from '../theme/visuallyHidden';
import { dragRegionSx, type ResolvedDesktop } from './desktop';

interface DrawerBrandProps {
  height: number;
  /** Menu estreito (recolhido ou trilho): só o símbolo, centralizado. */
  compact: boolean;
  desktop: ResolvedDesktop | null;
}

/**
 * Marca no topo do menu lateral, leva à página inicial. No app de desktop a faixa arrasta a janela (o link continua
 * clicável) e foge dos botões da janela: no menu largo a marca anda para o lado; no estreito, para baixo.
 */
export default function DrawerBrand({ height, compact, desktop }: DrawerBrandProps) {
  const { homePath, name } = useBranding();
  // só o símbolo: sem texto visível, o link leva o nome do sistema em texto escondido (com aria-label, o axe reprova
  // o nome que não contém as iniciais do símbolo)
  const label = compact ? (
    <Box component="span" sx={visuallyHidden}>
      {name}
    </Box>
  ) : null;
  const layout = {
    display: 'flex',
    alignItems: 'center',
    height,
    flexShrink: 0,
    px: compact ? 0 : 2.5,
    justifyContent: compact ? 'center' : 'flex-start'
  };
  const link = { color: 'text.primary', textDecoration: 'none' };

  if (!desktop)
    return (
      <Box component={RouterLink} to={homePath} sx={{ ...layout, ...link }}>
        <Logo compact={compact} />
        {label}
      </Box>
    );

  const controls = desktop.controls?.side === 'left' ? desktop.controls : null;
  // estreito: a marca desce para baixo dos botões e a faixa cresce o que faltar para caber o símbolo (32px + folga)
  const inset =
    controls && (compact ? { pt: `${controls.height}px`, height: Math.max(height, controls.height + 44) } : { pl: `${controls.width}px` });
  return (
    <Box sx={[layout, dragRegionSx, inset ?? {}]}>
      <Box component={RouterLink} to={homePath} sx={{ ...link, display: 'inline-flex', minWidth: 0 }}>
        <Logo compact={compact} />
        {label}
      </Box>
    </Box>
  );
}
