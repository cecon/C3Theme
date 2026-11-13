import type { ReactNode } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { CloseCircle } from 'iconsax-reactjs';
import { useUiText } from '../../i18n';
import type { SettingsDialogStatus } from './SettingsDialog';
export function Header({
  titleId,
  descriptionId,
  title,
  description,
  onRequestClose
}: {
  titleId: string;
  descriptionId: string;
  title: string;
  description?: string;
  onRequestClose: () => void;
}) {
  const t = useUiText();
  return (
    <Stack direction="row" sx={{ alignItems: 'flex-start', gap: 1, px: 2.5, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
      <Stack sx={{ flex: 1, minWidth: 0 }}>
        <Typography id={titleId} component="h2" variant="h5">
          {title}
        </Typography>
        {description !== undefined && (
          <Typography id={descriptionId} variant="body2" color="text.secondary">
            {description}
          </Typography>
        )}
      </Stack>
      <IconButton size="small" color="secondary" onClick={onRequestClose} aria-label={t('c3.close')}>
        <CloseCircle size={20} />
      </IconButton>
    </Stack>
  );
}

export function ConteudoDoStatus({
  status,
  mensagem,
  comoConceder,
  onRetry
}: {
  status: SettingsDialogStatus;
  mensagem?: string;
  comoConceder?: string;
  onRetry?: () => void;
}) {
  const t = useUiText();
  if (status === 'carregando') {
    return (
      <Stack sx={{ gap: 1.5 }} role="status">
        <LinearProgress />
        <Typography variant="body2" color="text.secondary">
          {t('c3.settingsModal.loading')}
        </Typography>
      </Stack>
    );
  }
  if (status === 'erro') {
    return (
      <Alert
        severity="error"
        action={
          onRetry && (
            <Button color="inherit" size="small" onClick={onRetry}>
              {t('c3.settingsModal.retry')}
            </Button>
          )
        }
      >
        {mensagem ?? t('c3.settingsModal.error')}
      </Alert>
    );
  }
  if (status === 'sem-permissao') {
    return (
      <Alert severity="info">
        <Typography variant="body2">{mensagem ?? t('c3.settingsModal.noPermission')}</Typography>
        <Typography variant="body2">{comoConceder ?? t('c3.settingsModal.noPermission.concede')}</Typography>
      </Alert>
    );
  }
  return null;
}

export function Footer({ footer, version, saving, saved }: { footer?: ReactNode; version?: string; saving: boolean; saved: boolean }) {
  const t = useUiText();
  return (
    <Stack
      direction="row"
      sx={{ alignItems: 'center', gap: 2, px: 2.5, py: 1, borderTop: 1, borderColor: 'divider', minHeight: 48, flexWrap: 'wrap' }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>{footer}</Box>
      <Typography variant="caption" color="text.secondary" aria-live="polite">
        {saving ? t('c3.settingsModal.saving') : saved ? t('c3.settingsModal.saved') : ''}
      </Typography>
      {version !== undefined && (
        <Typography variant="caption" color="text.secondary">
          {t('c3.settingsModal.version', { version })}
        </Typography>
      )}
    </Stack>
  );
}
