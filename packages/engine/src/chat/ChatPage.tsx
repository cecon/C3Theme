// Página de chat (`pages[].chat`, ADR 0006): o ChatPanel na altura útil da tela, abaixo do cabeçalho da shell.

import Paper from '@mui/material/Paper';

import ChatPanel from './ChatPanel';
import type { ChatDef } from './chatDef';

export default function ChatPage({ def }: { def: ChatDef }) {
  return (
    <Paper
      variant="outlined"
      sx={{ height: 'calc(100dvh - 180px)', minHeight: 420, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
    >
      <ChatPanel def={def} />
    </Paper>
  );
}
