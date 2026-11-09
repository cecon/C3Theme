// material-ui
import Box from '@mui/material/Box';

// third-party
import { Clock, TickCircle, Warning2 } from 'iconsax-reactjs';

import type { MessageStatus } from '../core/types';
import { useChatText } from './text';

/** Ícone da situação de uma mensagem minha; o nome vai para o leitor de tela. */
export default function MessageStatusIcon({ status }: { status: MessageStatus }) {
  const t = useChatText();
  const label = t(`c3.chat.status.${status}`);
  const icon =
    status === 'sending' ? (
      <Clock size={12} />
    ) : status === 'failed' ? (
      <Warning2 size={12} variant="Bold" />
    ) : status === 'sent' ? (
      <TickCircle size={12} />
    ) : (
      // entregue: dois tiques; lida: os mesmos, cheios
      <Box component="span" sx={{ display: 'inline-flex', '& svg + svg': { ml: '-5px' } }}>
        <TickCircle size={12} variant={status === 'read' ? 'Bold' : 'Linear'} />
        <TickCircle size={12} variant={status === 'read' ? 'Bold' : 'Linear'} />
      </Box>
    );
  return (
    <Box component="span" role="img" aria-label={label} title={label} sx={{ display: 'inline-flex', lineHeight: 0 }}>
      {icon}
    </Box>
  );
}
