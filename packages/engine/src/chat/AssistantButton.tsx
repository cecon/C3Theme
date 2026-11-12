// Botão do assistente no header (`layout.header.assistant`, ADR 0005): abre o ChatPanel numa gaveta à direita. A
// conversa só abre (e o SSE só conecta) quando o usuário abre a gaveta.

import { useState } from 'react';

// material-ui
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

// third-party
import { Magicpen } from 'iconsax-reactjs';

import { useText } from '../context';
import ChatPanel from './ChatPanel';
import { chatView, type ChatDef } from './chatDef';

export default function AssistantButton({ def }: { def: ChatDef }) {
  const text = useText();
  const [open, setOpen] = useState(false);
  const { title } = chatView(def, text);
  return (
    <>
      <Tooltip title={title}>
        <IconButton aria-label={title} aria-expanded={open} onClick={() => setOpen(true)} color="secondary">
          <Magicpen size={20} variant="Bulk" />
        </IconButton>
      </Tooltip>
      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        slotProps={{ paper: { 'aria-label': title, sx: { width: { xs: '100%', sm: 460 } } } }}
      >
        {open && <ChatPanel def={def} onClose={() => setOpen(false)} />}
      </Drawer>
    </>
  );
}
