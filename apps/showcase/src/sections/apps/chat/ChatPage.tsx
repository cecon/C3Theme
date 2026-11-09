import { useState } from 'react';

// material-ui
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import useMediaQuery from '@mui/material/useMediaQuery';
import type { Theme } from '@mui/material/styles';

import { Composer, MessageList, useDraft, useMessageWindow, useTypingStatus } from '@c3theme/chat';
import { FillHeight, notify } from '@c3theme/ui';
import ChatHeader from './ChatHeader';
import ContactDetails from './ContactDetails';
import ConversationList from './ConversationList';
import { CONTACTS, ME, Presence, PRESENCE } from './data';
import EmojiButton from './EmojiButton';
import StatusAvatar from './StatusAvatar';
import useDemoChat from './useDemoChat';

const LIST_WIDTH = 320;
const DETAILS_WIDTH = 300;
const MY_AUTHOR = { id: ME.id, name: ME.name };

/** Chat da vitrine montado com o @c3theme/chat sobre um transporte em memória. */
export default function ChatPage() {
  const wide = useMediaQuery((t: Theme) => t.breakpoints.up('md'));
  const extraWide = useMediaQuery((t: Theme) => t.breakpoints.up('xl'));

  const [activeId, setActiveId] = useState(CONTACTS[0].id);
  const [myPresence, setMyPresence] = useState<Presence>('online');
  const [listOpen, setListOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const demo = useDemoChat(activeId);
  const chat = useMessageWindow(demo.transport, activeId, { me: MY_AUTHOR });
  const draft = useDraft(activeId);
  const typing = useTypingStatus(demo.transport, activeId, MY_AUTHOR);
  const contact = CONTACTS.find((c) => c.id === activeId) ?? CONTACTS[0];

  function select(id: string) {
    setActiveId(id);
    setListOpen(false);
  }

  function send(text: string, files: File[]) {
    chat.send(text, { files });
    draft.clear();
    typing.stopped();
    demo.autoReply(contact.id);
  }

  function clearConversation() {
    demo.clear(contact.id);
    setConfirmClear(false);
    notify('Conversa apagada.', 'success');
  }

  const list = (
    <ConversationList
      conversations={demo.conversations}
      activeId={activeId}
      myPresence={myPresence}
      onPresence={(p) => {
        setMyPresence(p);
        notify(`Seu status agora é “${PRESENCE[p].label}”.`, 'info');
      }}
      onSelect={select}
    />
  );

  const details = <ContactDetails contact={contact} messages={chat.messages} onClose={() => setDetailsOpen(false)} />;

  return (
    <FillHeight>
      <Stack direction="row" spacing={2} sx={{ flex: 1, minHeight: 420 }}>
        {wide ? (
          <Paper variant="outlined" sx={{ width: LIST_WIDTH, flexShrink: 0, borderRadius: 3, overflow: 'hidden' }}>
            {list}
          </Paper>
        ) : (
          <Drawer open={listOpen} onClose={() => setListOpen(false)} slotProps={{ paper: { sx: { width: LIST_WIDTH, maxWidth: '88vw' } } }}>
            {list}
          </Drawer>
        )}

        <Paper
          variant="outlined"
          sx={{ flex: 1, minWidth: 0, borderRadius: 3, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        >
          <ChatHeader
            contact={contact}
            typing={typing.typing.length > 0}
            showMenuButton={!wide}
            detailsOpen={detailsOpen}
            onOpenList={() => setListOpen(true)}
            onToggleDetails={() => setDetailsOpen((o) => !o)}
            onClear={() => setConfirmClear(true)}
          />
          <Divider />
          <Stack sx={{ flex: 1, minHeight: 0 }}>
            <MessageList
              title={contact.name}
              messages={chat.messages}
              hasMore={chat.hasMore}
              loadingOlder={chat.loading === 'older'}
              onLoadOlder={chat.loadOlder}
              onRetry={chat.retry}
              typing={typing.typing}
              renderAvatar={() => <StatusAvatar name={contact.name} tone={contact.tone} presence={contact.presence} size="sm" />}
            />
          </Stack>
          <Divider />
          <Composer
            value={draft.text}
            onChange={draft.setText}
            onSend={send}
            onTyping={typing.typed}
            actions={<EmojiButton onPick={(emoji) => draft.setText(draft.text + emoji)} />}
          />
        </Paper>

        {extraWide ? (
          detailsOpen && (
            <Paper variant="outlined" sx={{ width: DETAILS_WIDTH, flexShrink: 0, borderRadius: 3, overflow: 'hidden' }}>
              {details}
            </Paper>
          )
        ) : (
          <Drawer
            anchor="right"
            open={detailsOpen}
            onClose={() => setDetailsOpen(false)}
            slotProps={{ paper: { sx: { width: DETAILS_WIDTH + 20, maxWidth: '92vw' } } }}
          >
            {details}
          </Drawer>
        )}

        <Dialog open={confirmClear} onClose={() => setConfirmClear(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Limpar conversa?</DialogTitle>
          <DialogContent>
            <DialogContentText>Todas as mensagens com {contact.name} serão apagadas. Essa ação não pode ser desfeita.</DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button color="secondary" onClick={() => setConfirmClear(false)}>
              Cancelar
            </Button>
            <Button color="error" variant="contained" onClick={clearConversation}>
              Limpar
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </FillHeight>
  );
}
