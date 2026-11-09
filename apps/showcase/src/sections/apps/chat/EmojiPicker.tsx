// material-ui
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';

import { EMOJIS } from './data';

/** Grade simples com os emojis mais usados. */
export default function EmojiPicker({ onPick }: { onPick: (emoji: string) => void }) {
  return (
    <Box sx={{ p: 1.5, width: 296 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 0.5, pb: 1 }}>
        Mais usados
      </Typography>
      <Box role="listbox" aria-label="Emojis" sx={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 0.25 }}>
        {EMOJIS.map((emoji) => (
          <ButtonBase
            key={emoji}
            role="option"
            aria-label={emoji}
            aria-selected={false}
            onClick={() => onPick(emoji)}
            sx={{
              fontSize: 22,
              lineHeight: 1,
              aspectRatio: '1',
              borderRadius: 1.5,
              '&:hover, &.Mui-focusVisible': { bgcolor: 'action.hover' }
            }}
          >
            {emoji}
          </ButtonBase>
        ))}
      </Box>
    </Box>
  );
}
