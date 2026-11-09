// material-ui
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { Author } from '../core/types';
import Dots from './Dots';
import { useChatText } from './text';

/** Três pontos e "Ana está digitando…". Sem ninguém digitando, não ocupa espaço. */
export default function TypingIndicator({ authors }: { authors: Author[] }) {
  const t = useChatText();
  const label =
    authors.length === 0
      ? ''
      : authors.length === 1
        ? t('c3.chat.typing.one', { name: authors[0].name })
        : t('c3.chat.typing.many', { count: authors.length });
  return (
    <Box aria-live="polite" sx={{ minHeight: authors.length ? 40 : 0 }}>
      {authors.length > 0 && (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', pt: 0.5 }}>
          <Box sx={{ px: 1.5, py: 1.25, borderRadius: 3, borderEndStartRadius: 6, bgcolor: 'action.hover' }}>
            <Dots />
          </Box>
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
        </Stack>
      )}
    </Box>
  );
}
