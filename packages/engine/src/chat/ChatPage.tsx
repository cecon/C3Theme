// Página de chat (`pages[].chat`, ADR 0006): o ChatPanel na altura útil da tela, abaixo do cabeçalho da shell. A
// conversa pode vir da rota (`/conversa/:conversation`, ADR 0009): trocar de conversa remonta o painel inteiro.

import { useParams } from 'react-router';

// material-ui
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';

import ChatPanel from './ChatPanel';
import { pageConversation, type ChatDef } from './chatDef';

export default function ChatPage({ def, path }: { def: ChatDef; path?: string }) {
  const conversation = pageConversation(def, path, useParams());
  return (
    <Paper
      variant="outlined"
      sx={{ height: 'calc(100dvh - 180px)', minHeight: 420, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
    >
      {conversation === null ? (
        <Box sx={{ p: 2 }}>
          <Alert severity="warning">Conversa não encontrada: o endereço não traz uma conversa válida.</Alert>
        </Box>
      ) : (
        <ChatPanel key={conversation} def={{ ...def, conversation }} />
      )}
    </Paper>
  );
}
