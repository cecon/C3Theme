import Typography from '@mui/material/Typography';
import { useChatText } from '../text';

/** Marca textual: continua legível na bolha colorida e sem depender de cor. */
export default function PinnedMark() {
  const t = useChatText();
  return (
    <Typography variant="caption" component="span" sx={{ color: 'inherit', fontWeight: 600 }}>
      {t('c3.chat.pinned')}
    </Typography>
  );
}
