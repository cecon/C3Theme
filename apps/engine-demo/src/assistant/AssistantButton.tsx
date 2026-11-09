import { useMemo, useRef, useState } from 'react';

// material-ui
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

// third-party
import { Magicpen } from 'iconsax-reactjs';

import { AssistantPanel, useMessageWindow, type UiRenderers } from '@c3theme/chat';
import { agentUiRenderers, useEngine } from '@c3theme/engine';

import { CONVERSATION, demoAgent, ME, SUGGESTIONS } from './demoAgent';

// os renderizadores do motor têm a mesma forma das partes do chat (o motor não depende do pacote de chat)
const renderers: UiRenderers = agentUiRenderers;

/**
 * Botão do header (app.json `layout.header.actions`) que abre o assistente numa gaveta. As telas que ele monta
 * são do motor e gravam pela API do c3-example, com a sessão de quem está logado.
 */
export default function AssistantButton() {
  const { client } = useEngine();
  const live = useRef(client);
  live.current = client;
  const [open, setOpen] = useState(false);
  const transport = useMemo(() => demoAgent(() => live.current), []);
  const chat = useMessageWindow(transport, CONVERSATION, { me: ME });

  return (
    <>
      <Tooltip title="Assistente">
        <IconButton aria-label="Assistente" onClick={() => setOpen(true)} color="secondary">
          <Magicpen size={20} variant="Bulk" />
        </IconButton>
      </Tooltip>
      <Drawer anchor="right" open={open} onClose={() => setOpen(false)} slotProps={{ paper: { sx: { width: { xs: '100%', sm: 460 } } } }}>
        <AssistantPanel chat={chat} onClose={() => setOpen(false)} suggestions={SUGGESTIONS} uiRenderers={renderers} />
      </Drawer>
    </>
  );
}
