// material-ui
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';

import type { Conversation } from '../core/types';
import { useChatText } from './text';

/** "Apagar “título”? Essa ação não pode ser desfeita." antes de apagar a conversa. */
export default function DeleteConversationDialog(props: {
  conversation: Conversation | null;
  onClose: () => void;
  onDelete: (id: string) => void;
}) {
  const t = useChatText();
  const { conversation, onClose } = props;
  return (
    <Dialog open={!!conversation} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogContent>
        <DialogContentText>{t('c3.chat.deleteConfirm', { title: conversation?.title ?? '' })}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button color="secondary" onClick={onClose}>
          {t('c3.chat.cancel')}
        </Button>
        <Button
          color="error"
          variant="contained"
          onClick={() => {
            if (conversation) props.onDelete(conversation.id);
            onClose();
          }}
        >
          {t('c3.chat.delete')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
