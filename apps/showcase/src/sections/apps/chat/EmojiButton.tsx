import { useState } from 'react';

// material-ui
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import Tooltip from '@mui/material/Tooltip';

// third-party
import { EmojiHappy } from 'iconsax-reactjs';

import EmojiPicker from './EmojiPicker';

/** Botão de emoji para as `actions` do Composer: o pacote não traz seletor, cada app põe o seu. */
export default function EmojiButton({ onPick }: { onPick: (emoji: string) => void }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return (
    <>
      <Tooltip title="Emojis">
        <IconButton size="small" aria-label="Inserir emoji" onClick={(e) => setAnchor(e.currentTarget)}>
          <EmojiHappy size={20} />
        </IconButton>
      </Tooltip>
      <Popover
        open={!!anchor}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <EmojiPicker
          onPick={(emoji) => {
            onPick(emoji);
            setAnchor(null);
          }}
        />
      </Popover>
    </>
  );
}
