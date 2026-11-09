// material-ui
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { DocumentText } from 'iconsax-reactjs';

import type { Attachment } from '../core/types';
import { clock, useBytesFormat } from './format';
import { useChatText } from './text';

export interface AttachmentViewProps {
  attachment: Attachment;
  /** Dentro do meu balão (fundo cheio da cor primária): cartão translúcido. */
  onPrimary?: boolean;
}

/** Anexo no balão: imagem vira miniatura, áudio vira player, o resto vira cartão com nome, tamanho e link. */
export default function AttachmentView({ attachment: a, onPrimary }: AttachmentViewProps) {
  const t = useChatText();
  const bytes = useBytesFormat();

  if (a.contentType.startsWith('image/') && (a.thumbnailUrl || a.url)) {
    return (
      <Link
        href={a.url}
        target="_blank"
        rel="noopener"
        aria-label={t('c3.chat.download', { name: a.name })}
        sx={{ display: 'block', mt: 0.75 }}
      >
        <Box
          component="img"
          src={a.thumbnailUrl ?? a.url}
          alt={a.name}
          loading="lazy"
          sx={{ display: 'block', maxWidth: '100%', maxHeight: 280, borderRadius: 2, objectFit: 'cover' }}
        />
      </Link>
    );
  }

  if (a.contentType.startsWith('audio/') && a.url) {
    return (
      <Stack spacing={0.5} sx={{ mt: 0.75, minWidth: { xs: 200, sm: 260 } }}>
        <Box component="audio" controls preload="metadata" src={a.url} aria-label={a.name} sx={{ width: '100%', height: 36 }} />
        {a.durationMs !== undefined && (
          <Typography variant="caption" sx={{ opacity: onPrimary ? 1 : 0.75, color: 'inherit' }}>
            {clock(a.durationMs)}
          </Typography>
        )}
      </Stack>
    );
  }

  const name = (
    <Typography variant="body2" noWrap sx={{ fontWeight: 500, color: 'inherit' }}>
      {a.name || t('c3.chat.attachment')}
    </Typography>
  );
  return (
    <Stack
      direction="row"
      spacing={1.25}
      sx={(theme) => ({
        alignItems: 'center',
        p: 1,
        pr: 1.5,
        mt: 0.75,
        borderRadius: 1.5,
        bgcolor: onPrimary ? 'rgb(255 255 255 / 0.16)' : theme.vars.palette.background.paper,
        border: onPrimary ? 0 : 1,
        borderColor: 'divider'
      })}
    >
      <DocumentText size={24} variant="Bulk" />
      <Box sx={{ minWidth: 0 }}>
        {a.url ? (
          <Link
            href={a.url}
            download={a.name}
            color="inherit"
            underline="hover"
            aria-label={t('c3.chat.download', { name: a.name })}
            sx={{ display: 'block' }}
          >
            {name}
          </Link>
        ) : (
          name
        )}
        <Typography variant="caption" sx={{ opacity: onPrimary ? 1 : 0.75, color: 'inherit' }}>
          {bytes(a.size)}
        </Typography>
      </Box>
    </Stack>
  );
}
