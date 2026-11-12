import { useEffect } from 'react';

// material-ui
import Alert from '@mui/material/Alert';

import type { Notice } from '../../core/window';
import { useChatText } from '../text';

export interface NoticeBarProps {
  /** O aviso mais recente da conversa (`useMessageWindow().notice`). */
  notice: Notice | null;
  onDismiss: () => void;
  /** Quanto o aviso fica, em milissegundos. Padrão: 8 s. */
  duration?: number;
}

/**
 * Aviso passageiro do sistema na conversa (evento `notice`), acima da caixa: o texto vem pronto do sistema, sai sozinho
 * depois de `duration` e tem fechar. É lido pelo leitor de tela sem tirar o foco da caixa.
 */
export default function NoticeBar({ notice, onDismiss, duration = 8000 }: NoticeBarProps) {
  const t = useChatText();
  const seq = notice?.seq;
  useEffect(() => {
    if (seq === undefined) return;
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [seq, duration, onDismiss]);
  if (!notice) return null;
  return (
    <Alert
      role="status"
      aria-label={t('c3.chat.notice')}
      severity={notice.tone}
      onClose={onDismiss}
      slotProps={{ closeButton: { title: t('c3.chat.close'), 'aria-label': t('c3.chat.close') } }}
      sx={{ mx: { xs: 1.5, sm: 2 }, mb: 1, py: 0.25, typography: 'body2' }}
    >
      {notice.text}
    </Alert>
  );
}
