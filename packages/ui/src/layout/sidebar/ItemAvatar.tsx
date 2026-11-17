import Avatar from '@mui/material/Avatar';
import { useTheme } from '@mui/material/styles';

import { initials } from '../UserMenuTrigger';
import type { SidebarAvatar } from './types';

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Avatar do item da lista (#135): iniciais sobre a cor declarada, com texto claro ou escuro pelo contraste. */
export default function ItemAvatar({ avatar }: { avatar: SidebarAvatar }) {
  const theme = useTheme();
  // cor fora do formato hex não quebra a lista: cai na cor neutra do tema
  const color = avatar.color && HEX.test(avatar.color) ? avatar.color : undefined;
  return (
    <Avatar
      aria-hidden="true"
      sx={{ width: 28, height: 28, fontSize: 12, ...(color && { bgcolor: color, color: theme.palette.getContrastText(color) }) }}
    >
      {initials(avatar.label)}
    </Avatar>
  );
}
