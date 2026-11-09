import type { ReactNode } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { Message } from '../core/types';
import AttachmentView from './AttachmentView';
import { useTimeFormat } from './format';
import Markdown from './Markdown';
import MessageStatusIcon from './MessageStatusIcon';
import { useChatText } from './text';

export interface MessageBubbleProps {
  message: Message;
  /** Continua o bloco da anterior (mesmo autor, pouco tempo): cantos mais retos, sem nome. */
  grouped?: boolean;
  /** Mostra o nome do autor no primeiro balão do bloco (conversa em grupo). */
  showAuthor?: boolean;
  /**
   * Como o texto vira tela. Padrão: markdown seguro se `format: 'markdown'`, senão texto puro com quebras de
   * linha. É aqui que entra o markup do WhatsApp
   * (*negrito*, _itálico_), links ou menções, do jeito que o app quiser.
   */
  renderText?: (text: string, message: Message) => ReactNode;
  onRetry?: (clientId: string) => void;
}

/** Balão de uma mensagem: texto, anexos, hora e situação do envio. Aviso do sistema sai centralizado, sem balão. */
export default function MessageBubble({ message: m, grouped, showAuthor, renderText, onRetry }: MessageBubbleProps) {
  const t = useChatText();
  const time = useTimeFormat();
  const mine = m.direction === 'out';

  if (m.kind === 'system') {
    return (
      <Typography variant="caption" color="text.secondary" component="p" sx={{ textAlign: 'center', py: 0.5 }}>
        {m.text}
      </Typography>
    );
  }

  const failed = m.status === 'failed';
  return (
    <Stack sx={{ alignItems: mine ? 'flex-end' : 'flex-start', maxWidth: { xs: '85%', md: '70%' } }}>
      <Box
        sx={(theme) => ({
          px: 1.75,
          py: 1.25,
          borderRadius: 3,
          opacity: m.status === 'sending' ? 0.8 : 1,
          ...(mine
            ? { bgcolor: 'primary.main', color: 'primary.contrastText', borderEndEndRadius: 6, ...(grouped && { borderStartEndRadius: 6 }) }
            : {
                bgcolor: theme.vars.palette.action.hover,
                color: 'text.primary',
                borderEndStartRadius: 6,
                ...(grouped && { borderStartStartRadius: 6 })
              }),
          ...(failed && { bgcolor: 'error.main', color: 'error.contrastText' })
        })}
      >
        {showAuthor && !mine && !grouped && (
          <Typography variant="caption" component="p" sx={{ fontWeight: 600, color: 'primary.main', mb: 0.25 }}>
            {m.author.name}
          </Typography>
        )}
        {m.text && (
          <Typography
            variant="body2"
            component="div"
            sx={{ whiteSpace: m.format === 'markdown' ? 'normal' : 'pre-wrap', overflowWrap: 'anywhere', color: 'inherit' }}
          >
            {renderText ? renderText(m.text, m) : m.format === 'markdown' ? <Markdown text={m.text} /> : m.text}
          </Typography>
        )}
        {m.attachments?.map((a) => (
          <AttachmentView key={a.id} attachment={a} onPrimary={mine || failed} />
        ))}
        {/* na bolha colorida a hora fica em cor cheia: esmaecida caía abaixo de 4,5:1 */}
        <Stack
          direction="row"
          spacing={0.5}
          sx={{ alignItems: 'center', justifyContent: 'flex-end', mt: 0.5, opacity: mine || failed ? 1 : 0.8 }}
        >
          <Typography variant="caption" component="time" dateTime={m.createdAt} sx={{ color: 'inherit', lineHeight: 1 }}>
            {time(m.createdAt)}
          </Typography>
          {mine && m.status && <MessageStatusIcon status={m.status} />}
        </Stack>
      </Box>
      {failed && onRetry && m.clientId && (
        <Button size="small" color="error" onClick={() => onRetry(m.clientId!)} sx={{ mt: 0.25 }}>
          {t('c3.chat.retry')}
        </Button>
      )}
    </Stack>
  );
}
