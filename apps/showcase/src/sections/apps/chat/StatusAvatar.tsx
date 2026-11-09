// material-ui
import Badge from '@mui/material/Badge';

import { SoftAvatar, toneMain, type SoftAvatarProps, type Tone } from '@c3theme/ui';
import { PRESENCE, Presence } from './data';

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

interface StatusAvatarProps {
  name: string;
  tone: Tone;
  presence: Presence;
  size?: SoftAvatarProps['size'];
}

/** Avatar com as iniciais e um ponto de presença no canto. */
export default function StatusAvatar({ name, tone, presence, size = 'md' }: StatusAvatarProps) {
  const dot = size === 'lg' || size === 'xl' ? 14 : 11;
  return (
    <Badge
      overlap="circular"
      variant="dot"
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      aria-label={PRESENCE[presence].label}
      sx={(theme) => ({
        flexShrink: 0,
        '& .MuiBadge-badge': {
          width: dot,
          height: dot,
          minWidth: dot,
          borderRadius: '50%',
          bgcolor: toneMain(theme, PRESENCE[presence].tone),
          boxShadow: `0 0 0 2px ${theme.vars.palette.background.paper}`
        }
      })}
    >
      <SoftAvatar tone={tone} size={size}>
        {initials(name)}
      </SoftAvatar>
    </Badge>
  );
}
