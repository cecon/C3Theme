import type { ReactNode } from 'react';

// material-ui
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { SxProps, Theme } from '@mui/material/styles';

// third-party
import { BoxRemove } from 'iconsax-reactjs';

import { useUiText } from '../i18n';
import SoftAvatar from './SoftAvatar';

export interface EmptyStateProps {
  /** Padrão: "Nada por aqui". */
  title?: ReactNode;
  description?: ReactNode;
  /** Botão do próximo passo, ex.: "Nova conversa". */
  action?: ReactNode;
  icon?: ReactNode;
  /** Menos espaço em volta, para painel lateral, lista curta ou cartão. */
  dense?: boolean;
  sx?: SxProps<Theme>;
}

/** Lugar vazio: ícone, o que aconteceu e o que fazer. Para lista, tabela, caixa de entrada, busca sem resultado. */
export default function EmptyState({ title, description, action, icon, dense, sx }: EmptyStateProps) {
  const t = useUiText();
  return (
    <Stack sx={[{ alignItems: 'center', textAlign: 'center', gap: 1, py: dense ? 3 : 6, px: 2 }, ...(Array.isArray(sx) ? sx : [sx])]}>
      <SoftAvatar tone="neutral" size={dense ? 'md' : 'lg'}>
        {icon ?? <BoxRemove size={dense ? 22 : 28} />}
      </SoftAvatar>
      <Typography variant="subtitle1" component="p" sx={{ mt: 1 }}>
        {title ?? t('c3.empty')}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360 }}>
          {description}
        </Typography>
      )}
      {action && <Stack sx={{ mt: 1 }}>{action}</Stack>}
    </Stack>
  );
}
