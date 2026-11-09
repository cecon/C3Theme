// material-ui
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { useBranding } from '../config';

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');

/** Marca padrão: quadrado na cor primária com `branding.mark` ou as iniciais do sistema. */
export function LogoMark({ size = 32, text }: { size?: number; text?: string }) {
  const { name, mark } = useBranding();
  const initials = (text === undefined && mark) || initialsOf(text ?? name);
  return (
    <Box
      aria-hidden
      sx={{
        width: size,
        height: size,
        borderRadius: `${size / 4}px`,
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        display: 'grid',
        placeItems: 'center',
        fontWeight: 700,
        fontSize: size * 0.42,
        letterSpacing: '-0.02em',
        flexShrink: 0
      }}
    >
      {initials || 'C3'}
    </Box>
  );
}

/** Logo do sistema: o `branding.logo` quando existir, senão a marca padrão com o nome. */
export default function Logo({ compact = false }: { compact?: boolean }) {
  const { name, logo } = useBranding();
  if (logo) return <>{logo}</>;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
      <LogoMark />
      {!compact && (
        <Typography variant="h5" noWrap>
          {name}
        </Typography>
      )}
    </Box>
  );
}
