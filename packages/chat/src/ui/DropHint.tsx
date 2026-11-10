import Typography from '@mui/material/Typography';

import { useChatText } from './text';

/** Aviso enquanto há arquivo sendo arrastado por cima do composer: soltar anexa. */
export default function DropHint() {
  const t = useChatText();
  return (
    <Typography variant="caption" color="primary" role="status" component="p" sx={{ mb: 1, fontWeight: 600 }}>
      {t('c3.chat.dropHere')}
    </Typography>
  );
}
