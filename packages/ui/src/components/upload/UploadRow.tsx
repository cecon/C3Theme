// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { CloseCircle, DocumentText } from 'iconsax-reactjs';

import { useUiText } from '../../i18n';
import type { UploadItem } from './queue';

/** Tamanho legível: B, KB ou MB. */
export const formatSize = (bytes: number, locale?: string) =>
  bytes < 1024
    ? `${bytes} B`
    : bytes < 1 << 20
      ? `${Math.round(bytes / 1024).toLocaleString(locale)} KB`
      : `${(bytes / (1 << 20)).toLocaleString(locale, { maximumFractionDigits: 1 })} MB`;

interface RowProps {
  name: string;
  size: number;
  locale: string;
  /** Enviado: link para baixar. */
  url?: string;
  /** Enviando: barra; erro: mensagem e "Tentar de novo". */
  item?: UploadItem;
  onRemove?: () => void;
  onRetry?: () => void;
  removeLabel: string;
}

/** Uma linha da lista: ícone, nome, tamanho e, durante o envio, a barra com a porcentagem. */
export function UploadRow({ name, size, locale, url, item, onRemove, onRetry, removeLabel }: RowProps) {
  const t = useUiText();
  const uploading = item && item.status !== 'done' && item.status !== 'error';
  const percent = Math.round((item?.progress ?? 0) * 100);
  return (
    <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', py: 0.75 }}>
      <DocumentText size={22} variant="Bulk" />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline' }}>
          <Typography variant="body2" noWrap sx={{ flex: 1, minWidth: 0 }}>
            {url ? (
              <Link href={url} target="_blank" rel="noopener" underline="hover">
                {name}
              </Link>
            ) : (
              name
            )}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
            {uploading ? `${percent}%` : formatSize(size, locale)}
          </Typography>
        </Stack>
        {uploading && (
          <LinearProgress
            variant={item.status === 'waiting' ? 'indeterminate' : 'determinate'}
            value={percent}
            aria-label={name}
            sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
          />
        )}
        {item?.status === 'error' && (
          <Typography variant="caption" color="error" component="p">
            {item.error === 'network' ? t('c3.upload.network') : item.error}{' '}
            <Button size="small" color="error" onClick={onRetry} sx={{ minWidth: 0, p: 0, ml: 0.5, verticalAlign: 'baseline' }}>
              {t('c3.upload.retry')}
            </Button>
          </Typography>
        )}
      </Box>
      {onRemove && (
        <IconButton size="small" aria-label={removeLabel} onClick={onRemove}>
          <CloseCircle size={18} />
        </IconButton>
      )}
    </Stack>
  );
}
