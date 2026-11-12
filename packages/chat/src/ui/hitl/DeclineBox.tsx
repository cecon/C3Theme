import { useState } from 'react';

// material-ui
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';

import { useChatText } from '../text';

export interface DeclineBoxProps {
  /** Recusa com o motivo digitado (aparado; vazio vai sem motivo). */
  onDecline: (reason: string) => void;
  onBack: () => void;
  disabled?: boolean;
}

/**
 * Recusar com o porquê: o motivo volta ao agente, que tenta outro caminho em vez de repetir o mesmo pedido. O foco
 * vai para a caixa; Esc volta sem recusar.
 */
export default function DeclineBox({ onDecline, onBack, disabled }: DeclineBoxProps) {
  const t = useChatText();
  const [reason, setReason] = useState('');
  return (
    <Stack spacing={1}>
      <TextField
        autoFocus
        size="small"
        multiline
        minRows={2}
        label={t('c3.chat.hitl.reasonLabel')}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onBack();
        }}
        disabled={disabled}
      />
      <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
        <Button color="secondary" onClick={onBack} disabled={disabled}>
          {t('c3.chat.hitl.cancel')}
        </Button>
        <Button color="error" variant="outlined" onClick={() => onDecline(reason)} disabled={disabled}>
          {t('c3.chat.tool.sendDecline')}
        </Button>
      </Stack>
    </Stack>
  );
}
