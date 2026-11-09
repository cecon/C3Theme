import { ReactNode } from 'react';

// material-ui
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export interface MessagePageProps {
  /** Texto grande acima do título, ex.: "404". */
  code?: ReactNode;
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Botões (ex.: voltar ao início, tentar de novo). */
  action?: ReactNode;
  /** Ocupa a tela toda (página fora do layout) em vez de só a área de conteúdo. */
  fullScreen?: boolean;
  children?: ReactNode;
}

/** Página de recado: não encontrada, erro, manutenção, em breve. */
export default function MessagePage({ code, icon, title, description, action, fullScreen, children }: MessagePageProps) {
  return (
    <Stack
      spacing={2}
      sx={{
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        px: 2,
        py: fullScreen ? 4 : 10,
        minHeight: fullScreen ? '100vh' : undefined,
        bgcolor: fullScreen ? 'background.default' : undefined
      }}
    >
      {icon}
      {code && (
        <Typography sx={{ fontSize: { xs: '4.5rem', sm: '6rem' }, fontWeight: 700, lineHeight: 1, color: 'primary.main' }}>
          {code}
        </Typography>
      )}
      <Typography variant="h2">{title}</Typography>
      {description && (
        <Typography color="text.secondary" sx={{ maxWidth: 480 }}>
          {description}
        </Typography>
      )}
      {children}
      {action && (
        <Stack direction="row" spacing={1.5} sx={{ pt: 1 }}>
          {action}
        </Stack>
      )}
    </Stack>
  );
}
