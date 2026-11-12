import { useId, useState } from 'react';

// material-ui
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';

// third-party
import { Hierarchy, MessageQuestion, More } from 'iconsax-reactjs';

import { actionsFor, type MessageAction } from '../../core/lanes';
import type { Message } from '../../core/types';
import { useChatText } from '../text';

export interface MessageActionsMenuProps {
  message: Message;
  /** Ações declaradas; só as que valem para esta mensagem (`when`) aparecem. Nenhuma: o botão não aparece. */
  actions?: readonly MessageAction[];
  onAction?: (message: Message, actionId: string) => void;
}

/** Botão "Mais ações" de uma mensagem, com o menu das ações que valem para ela ("Ramificar daqui"). */
export default function MessageActionsMenu({ message, actions, onAction }: MessageActionsMenuProps) {
  const t = useChatText();
  const menuId = useId();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const items = actionsFor(message, actions);
  if (!onAction || items.length === 0) return null;

  function pick(id: string) {
    setAnchor(null);
    onAction!(message, id);
  }

  return (
    <>
      <Tooltip title={t('c3.chat.messageActions')}>
        <IconButton
          size="small"
          color="inherit"
          aria-label={t('c3.chat.messageActions')}
          aria-haspopup="menu"
          aria-controls={anchor ? menuId : undefined}
          aria-expanded={anchor ? true : undefined}
          onClick={(e) => setAnchor(e.currentTarget)}
          className="c3-message-actions"
        >
          <More size={16} />
        </IconButton>
      </Tooltip>
      <Menu id={menuId} anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
        {items.map((a) => (
          <MenuItem key={a.id} onClick={() => pick(a.id)}>
            {a.opens && <ListItemIcon>{a.opens === 'branch' ? <Hierarchy size={18} /> : <MessageQuestion size={18} />}</ListItemIcon>}
            <ListItemText>{a.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
