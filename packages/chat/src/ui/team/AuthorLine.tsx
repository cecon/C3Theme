// material-ui
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { AgentState } from '../../core/agents';
import type { Author } from '../../core/types';
import { useChatText } from '../text';

export interface AuthorLineProps {
  author: Author;
  state?: AgentState;
}

/**
 * Nome de quem escreveu, com a marca na cor do autor e o estado por extenso ("Cozinha · Trabalhando"). O nome fica
 * na cor do texto: a cor do autor vem do app e não garante contraste.
 */
export default function AuthorLine({ author, state }: AuthorLineProps) {
  const t = useChatText();
  return (
    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', minWidth: 0 }}>
      {author.color && <Box aria-hidden sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: author.color, flexShrink: 0 }} />}
      <Typography variant="subtitle2" component="span" noWrap>
        {author.name}
      </Typography>
      {state && state !== 'idle' && (
        <Typography variant="caption" color="text.secondary" component="span" noWrap>
          · {t(`c3.chat.agent.${state}`)}
        </Typography>
      )}
    </Stack>
  );
}
