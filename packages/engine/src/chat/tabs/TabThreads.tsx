import { useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { AgentComposer, AssistantPanel, useMessageWindow, type AssistantPanelProps, type Author, type ChatTransport } from '@c3theme/chat';

type Panel = Omit<AssistantPanelProps, 'chat'>;

/** Uma thread lateral aberta numa aba: a conversa comum dela, sem fechar nem título (a aba já diz qual é). */
export function LaneThread({ id, transport, me, panel }: { id: string; transport: ChatTransport; me: Author; panel: Panel }) {
  const chat = useMessageWindow(transport, id, { me });
  const { onClose: _close, title: _title, entregaDaUltimaMensagem: _delivery, empty: _empty, banner: _banner, ...rest } = panel;
  return <AssistantPanel {...rest} chat={chat} />;
}

/**
 * Thread nova ainda sem mensagem: só a caixa. Enviar cria a thread à parte com o texto; até lá nada vai para o
 * servidor, então o rascunho não sobrevive a reiniciar o app.
 */
export function DraftThread({ hint, panel, onSend }: { hint: string; panel: Panel; onSend: (text: string) => Promise<boolean> }) {
  const [value, setValue] = useState('');
  const [sending, setSending] = useState(false);
  return (
    <Stack sx={{ height: '100%', minHeight: 0 }}>
      <Box sx={{ flex: 1, display: 'grid', placeItems: 'center', p: 2 }}>
        <Typography color="text.secondary">{hint}</Typography>
      </Box>
      <Box sx={{ p: 1.5 }}>
        <AgentComposer
          {...panel.composer}
          files={false}
          value={value}
          onChange={setValue}
          busy={sending}
          onSend={(text) => {
            if (!text.trim()) return;
            setSending(true);
            void onSend(text).then((ok) => {
              setSending(false);
              if (ok) setValue('');
            });
          }}
        />
      </Box>
    </Stack>
  );
}
