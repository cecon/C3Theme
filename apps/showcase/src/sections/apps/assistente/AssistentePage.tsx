import { useMemo, useState } from 'react';

// material-ui
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import type { Theme } from '@mui/material/styles';

// third-party
import { Magicpen } from 'iconsax-reactjs';

import { AgentWorkspace, AssistantPanel, useMessageWindow, type Message } from '@c3theme/chat';
import { FillHeight } from '@c3theme/ui';
import { SUGGESTIONS } from './answers';
import useComposerDemo from './useComposerDemo';
import useDemoAssistant, { ME } from './useDemoAssistant';

const PANEL_WIDTH = 420;

/** A resposta que a área de trabalho mostra (a escolhida ou a última) e a pergunta que veio antes dela. */
function useFocus(messages: Message[], chosenId: string | null) {
  return useMemo(() => {
    const replies = messages.filter((m) => m.direction === 'in');
    const reply = replies.find((m) => m.id === chosenId) ?? replies.at(-1);
    if (!reply) return {};
    const before = messages.slice(0, messages.indexOf(reply)).filter((m) => m.direction === 'out');
    return { reply, question: before.at(-1)?.text };
  }, [messages, chosenId]);
}

/**
 * Assistente de IA com o mesmo @c3theme/chat do chat entre pessoas. Em tela larga: a área de trabalho do agente
 * (raciocínio e etapas ao vivo) ao lado do painel de conversa. No celular, o painel é gaveta e a área de trabalho
 * abre por cima pelo botão de cada resposta. As respostas são roteirizadas, mas chegam como chegariam de um modelo.
 */
export default function AssistentePage() {
  const wide = useMediaQuery((t: Theme) => t.breakpoints.up('lg'));
  const [open, setOpen] = useState(true);
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const demo = useDemoAssistant();
  const chat = useMessageWindow(demo.transport, demo.activeId, { me: ME });
  const focus = useFocus(chat.messages, chosenId);
  const composer = useComposerDemo(chat.messages);

  // pergunta nova: a área de trabalho volta a seguir a resposta em andamento
  const send: typeof chat.send = (text, opts) => {
    setChosenId(null);
    chat.send(text, opts);
  };

  const panel = (
    <AssistantPanel
      chat={{ ...chat, send }}
      onClose={() => setOpen(false)}
      conversations={demo.conversations}
      onSelectConversation={(id) => {
        setChosenId(null);
        demo.select(id);
      }}
      onNewConversation={demo.create}
      onDeleteConversation={demo.remove}
      onRegenerate={demo.regenerate}
      onOpenWorkspace={(m) => {
        setChosenId(m.id);
        setWorkspaceOpen(true);
      }}
      suggestions={SUGGESTIONS}
      composer={composer}
    />
  );

  const workspace = (
    <AgentWorkspace message={focus.reply} question={focus.question} onClose={wide ? undefined : () => setWorkspaceOpen(false)} />
  );

  return (
    <FillHeight>
      <Stack direction="row" spacing={2} sx={{ flex: 1, minHeight: 480 }}>
        {wide ? (
          <Paper variant="outlined" sx={{ flex: 1, minWidth: 0, borderRadius: 3, overflow: 'hidden' }}>
            {workspace}
          </Paper>
        ) : (
          <Paper variant="outlined" sx={{ flex: 1, minWidth: 0, borderRadius: 3, p: 3 }}>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Pergunte sobre produtos, vendas ou SQL. Cada resposta mostra o que o assistente pensou e consultou.
            </Typography>
          </Paper>
        )}

        {wide && open && (
          <Paper variant="outlined" sx={{ width: PANEL_WIDTH, flexShrink: 0, borderRadius: 3, overflow: 'hidden' }}>
            {panel}
          </Paper>
        )}
        {!wide && (
          <Drawer
            anchor="right"
            open={open}
            onClose={() => setOpen(false)}
            slotProps={{ paper: { sx: { width: PANEL_WIDTH, maxWidth: '100vw' } } }}
          >
            {panel}
          </Drawer>
        )}
        {!wide && (
          <Drawer
            anchor="bottom"
            open={workspaceOpen}
            onClose={() => setWorkspaceOpen(false)}
            slotProps={{ paper: { sx: { height: '85vh', borderTopLeftRadius: 16, borderTopRightRadius: 16 } } }}
          >
            {workspace}
          </Drawer>
        )}
      </Stack>
      {!open && (
        <Button
          variant="contained"
          startIcon={<Magicpen size={18} variant="Bulk" />}
          onClick={() => setOpen(true)}
          sx={{ position: 'fixed', right: 24, bottom: 24, zIndex: 'floating', borderRadius: 6 }}
        >
          Assistente
        </Button>
      )}
    </FillHeight>
  );
}
